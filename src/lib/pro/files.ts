// Browser file helpers shared by the Waha pro tools. Everything stays on the device.
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function canShareFiles() {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File([""], "x.pdf", { type: "application/pdf" })] })
    );
  } catch {
    return false;
  }
}

export async function shareBlob(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  try {
    await navigator.share({ files: [file], title: name });
    return true;
  } catch {
    return false;
  }
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

export function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), type, quality),
  );
}

export const stamp = () => new Date().toISOString().slice(0, 10);
