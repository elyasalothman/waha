import { MAX_FILE_BYTES, splitText, type Chapter } from "./model.ts";
import { readZip } from "./zip.ts";

function xml(text: string): Document {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("تعريفات XML الخارجية غير مدعومة.");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("بنية المستند غير صالحة.");
  return doc;
}
function nodes(doc: Document | Element, tag: string) {
  return Array.from(doc.getElementsByTagNameNS("*", tag));
}
function resolvePath(base: string, href: string) {
  const path = new URL(href, `https://book.invalid/${base}`);
  if (path.origin !== "https://book.invalid") throw new Error("مرجع خارجي غير مدعوم.");
  return decodeURIComponent(path.pathname.slice(1));
}

export async function importBookFile(
  file: File,
  progress: (text: string) => void,
): Promise<Chapter[]> {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error("اختر ملفًا حتى 20 ميغابايت.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  progress("جارٍ استخراج النص…");
  if (extension === "txt") return splitText(await file.text());
  if (extension === "pdf") {
    const { importPdf } = await import("../private/pdf-import");
    const { privatePdfOpener } = await import("../private/pdf-client");
    const result = await importPdf(
      file,
      await privatePdfOpener(),
      new AbortController().signal,
      (page, count) => progress(`استخراج الصفحة ${page} من ${count}`),
    );
    // A scan must not silently disappear from the converted book.
    if (result.book.textPages < result.book.pageCount)
      throw new Error("بعض صفحات PDF مصوّرة أو بلا نص؛ استخدم OCR أولًا كي لا يُفقد محتواها.");
    return splitText(
      result.content.pages.map((p) => p.blocks.map((b) => b.text).join("\n")).join("\n\n"),
    );
  }
  if (extension !== "epub" && extension !== "docx")
    throw new Error("الصيغ المدعومة: PDF وEPUB وDOCX وTXT.");
  const files = await readZip(await file.arrayBuffer());
  const read = (path: string) => {
    const value = files.get(path);
    if (!value) throw new Error(`المستند يفتقد ملفًا مطلوبًا: ${path}`);
    return new TextDecoder().decode(value);
  };
  if (extension === "docx") {
    const document = xml(read("word/document.xml"));
    return splitText(
      nodes(document, "p")
        .map((p) => {
          const text = nodes(p, "t")
            .map((n) => n.textContent ?? "")
            .join("");
          const style = nodes(p, "pStyle")[0];
          const heading =
            style &&
            Array.from(style.attributes).some(
              (a) => a.localName === "val" && /^Heading[123]$/i.test(a.value),
            );
          return `${heading ? "# " : ""}${text}`;
        })
        .join("\n"),
    );
  }
  if (files.has("META-INF/encryption.xml")) throw new Error("EPUB المشفّر غير مدعوم.");
  const root = nodes(xml(read("META-INF/container.xml")), "rootfile")[0]?.getAttribute("full-path");
  if (!root) throw new Error("فهرس EPUB مفقود.");
  const opf = xml(read(root));
  const items = new Map(
    nodes(opf, "item").map((n) => [n.getAttribute("id"), n.getAttribute("href")]),
  );
  const chapters: Chapter[] = [];
  for (const ref of nodes(opf, "itemref")) {
    if (ref.getAttribute("linear") === "no") continue;
    const href = items.get(ref.getAttribute("idref"));
    if (!href) throw new Error("ترتيب فصول EPUB غير صالح.");
    // Parse detached HTML, extract text only. Scripts, styles, links and images never enter the reader.
    const doc = new DOMParser().parseFromString(read(resolvePath(root, href)), "text/html");
    doc.querySelectorAll("script,style,iframe,object,svg,nav").forEach((n) => n.remove());
    const title =
      doc.querySelector("h1,h2,h3")?.textContent?.trim().slice(0, 160) ||
      `الفصل ${chapters.length + 1}`;
    const elements = Array.from(doc.body.querySelectorAll("p,h1,h2,h3,li,blockquote"));
    const text = elements.length
      ? elements
          .filter((n) => !n.querySelector("p,li,blockquote"))
          .map((n) => n.textContent ?? "")
          .join("\n")
      : (doc.body.textContent ?? "");
    if (text.trim())
      chapters.push(...splitText(text).map((c, i) => ({ ...c, title: i ? c.title : title })));
  }
  // Aggregate validation protects documents split across many small entries.
  splitText(chapters.flatMap((c) => c.paragraphs).join("\n"));
  return chapters;
}
