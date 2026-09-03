export function zatcaTlvBase64(input: {
  seller: string;
  vatNo: string;
  timestamp: string;
  total: string;
  vat: string;
}) {
  const enc = new TextEncoder();
  const chunks: number[] = [];
  function add(tag: number, value: string) {
    const bytes = enc.encode(value);
    chunks.push(tag, bytes.length, ...bytes);
  }
  add(1, input.seller.trim());
  add(2, input.vatNo.trim());
  add(3, input.timestamp.trim());
  add(4, input.total.trim());
  add(5, input.vat.trim());
  const bytes = new Uint8Array(chunks);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
