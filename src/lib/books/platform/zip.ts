// ZIP central directory reader for EPUB/DOCX. No archive files are executed or written.
// Limits apply before and during decompression, including forged size headers.
export async function readZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--)
    if (view.getUint32(end, true) === 0x06054b50) break;
  if (end < 0 || end < bytes.length - 65557) throw new Error("ملف ZIP غير صالح.");
  const count = view.getUint16(end + 10, true);
  if (count > 2000) throw new Error("عدد ملفات الأرشيف كبير جدًا.");
  let offset = view.getUint32(end + 16, true);
  let total = 0;
  const files = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error("فهرس الأرشيف غير صالح.");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLen = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLen));
    const local = view.getUint32(offset + 42, true);
    offset += 46 + nameLen + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
    if (flags & 1) throw new Error("الملفات المشفّرة أو المحمية غير مدعومة.");
    // Ignore images/fonts/media: only text documents participate in reflow.
    if (!/\.(?:xml|opf|html|xhtml|htm)$/i.test(name)) continue;
    if (size > 4_000_000 || total + size > 12_000_000) throw new Error("النص المفكوك كبير جدًا.");
    if (local + 30 > bytes.length || view.getUint32(local, true) !== 0x04034b50)
      throw new Error("محتوى الأرشيف غير صالح.");
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    if (start + compressed > bytes.length) throw new Error("الأرشيف ناقص.");
    let output: Uint8Array;
    if (method === 0) output = bytes.slice(start, start + compressed);
    else if (method === 8) {
      const stream = new Blob([bytes.slice(start, start + compressed)])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 4_000_000 || total + length > 12_000_000) {
          await reader.cancel();
          throw new Error("النص المفكوك كبير جدًا.");
        }
        chunks.push(value);
      }
      output = new Uint8Array(length);
      let position = 0;
      for (const chunk of chunks) {
        output.set(chunk, position);
        position += chunk.length;
      }
    } else throw new Error("ضغط الأرشيف غير مدعوم.");
    if (output.length !== size) throw new Error("حجم الأرشيف غير مطابق.");
    total += output.length;
    files.set(name, output);
  }
  return files;
}
