import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

export async function pdfEngine() {
  const pdf = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdf.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdf;
}

export async function privatePdfOpener() {
  const pdf = await pdfEngine();
  return (bytes: Uint8Array) =>
    pdf.getDocument({
      data: bytes,
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
      wasmUrl: "/pdfjs/wasm/",
      enableXfa: false,
      // Preserve normal 300-dpi scans; the canvas policy bounds rendered output.
      maxImageSize: -1,
      canvasMaxAreaInBytes: 32_000_000,
      stopAtErrors: true,
      verbosity: 0,
    });
}

export async function openPrivatePdf(bytes: Uint8Array) {
  return (await privatePdfOpener())(bytes);
}
