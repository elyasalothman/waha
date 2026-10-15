import { mayPublish, summarize, validateBook, type ReadingBook } from "./model";
const headers = { "Cache-Control": "no-store" };
const configured = () => Boolean(process.env.DATABASE_URL?.trim());
const authReady = () =>
  [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "GROK_AUTH_CLIENT_ID",
    "GROK_AUTH_CLIENT_SECRET",
    "BOOKS_ADMIN_USER_IDS",
  ].every((k) => process.env[k]?.trim()) && process.env.VITE_AUTH_ENABLED !== "false";
export async function getPublicBooks(request: Request): Promise<Response> {
  // Missing production storage is explicit; never use ephemeral PGlite for public books.
  if (!configured()) return Response.json({ books: [], publishingConfigured: false }, { headers });
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const id = new URL(request.url).searchParams.get("id");
  if (id && !/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ message: "معرّف غير صالح." }, { status: 400, headers });
  if (id) {
    const rows = await sql.query<ReadingBook>(
      "select id, title, author, category, audience, cover, chapters from public_books where id = $1",
      [id],
    );
    return Response.json(rows[0] ?? null, { status: rows[0] ? 200 : 404, headers });
  }
  const rows = await sql.query<ReadingBook>(
    "select id, title, author, category, audience, cover, chapters from public_books order by created_at desc limit 200",
  );
  return Response.json(
    { books: rows.map(summarize), publishingConfigured: authReady() },
    { headers },
  );
}
export async function publishBook(request: Request): Promise<Response> {
  if (!authReady())
    return Response.json(
      {
        message:
          "النشر العام غير مهيأ: يلزم توصيل قاعدة الإنتاج والحساب وتعيين المدير. يمكنك حفظ مسودة محلية ومعاينتها.",
      },
      { status: 503, headers },
    );
  // Same-origin CSRF protection, followed by a real verified session and server allowlist.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(process.env.BETTER_AUTH_URL!).origin)
    return Response.json({ message: "طلب غير مصرح." }, { status: 403, headers });
  const { auth } = await import("@/lib/auth/server");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user)
    return Response.json({ message: "سجّل الدخول بحساب المدير." }, { status: 401, headers });
  if (!mayPublish(session.user.id, process.env.BOOKS_ADMIN_USER_IDS))
    return Response.json(
      { message: "هذا الحساب لا يملك صلاحية نشر الكتب." },
      { status: 403, headers },
    );
  if (Number(request.headers.get("content-length")) > 4_000_000)
    return Response.json({ message: "حجم الطلب كبير." }, { status: 413, headers });
  let input: unknown;
  try {
    // Bound streamed bodies too; Content-Length may be absent or forged.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("طلب فارغ.");
    const decoder = new TextDecoder();
    let bytes = 0,
      text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4_000_000) {
        await reader.cancel();
        return Response.json({ message: "حجم الطلب كبير." }, { status: 413, headers });
      }
      text += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(text + decoder.decode());
    if ((input as { rightsConfirmed?: boolean }).rightsConfirmed !== true)
      throw new Error("يلزم تأكيد حقوق النشر.");
    const book = validateBook(input);
    book.id = crypto.randomUUID();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      "insert into public_books (id, owner_id, title, author, category, audience, cover, chapters) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
      [
        book.id,
        session.user.id,
        book.title,
        book.author,
        book.category,
        book.audience,
        book.cover,
        JSON.stringify(book.chapters),
      ],
    );
    return Response.json({ id: book.id }, { status: 201, headers });
  } catch (error) {
    // Validation errors can be shown; internal database details must stay server-side.
    if (error instanceof SyntaxError)
      return Response.json({ message: "بيانات الطلب غير صالحة." }, { status: 400, headers });
    const message = error instanceof Error ? error.message : "";
    if (/^(?:بيانات|أكمل|الغلاف|عدد الفصول|الفصول|حجم النص|يلزم تأكيد|طلب فارغ)/.test(message))
      return Response.json({ message }, { status: 400, headers });
    console.error("[books] publish failed");
    return Response.json(
      { message: "تعذّر حفظ الكتاب في قاعدة الإنتاج. حاول مجددًا." },
      { status: 503, headers },
    );
  }
}
