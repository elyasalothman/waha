import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
type Photo = { id: string; data: string; at: string };
const DB = "waha-camera";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function photos(
  action: "list" | "save" | "delete",
  value?: Photo | string,
): Promise<Photo[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("photos", action === "list" ? "readonly" : "readwrite");
      const store = tx.objectStore("photos");
      const r =
        action === "list"
          ? store.getAll()
          : action === "save"
            ? store.put(value)
            : store.delete(value as string);
      tx.oncomplete = () => resolve(action === "list" ? (r.result as Photo[]) : []);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function CameraApp() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const [gallery, setGallery] = useState<Photo[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function stop() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setRunning(false);
  }
  useEffect(() => {
    alive.current = true;
    void photos("list")
      .then((p) => {
        if (alive.current) setGallery(p.reverse());
      })
      .catch(() => setError("التخزين المحلي غير متاح."));
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      alive.current = false;
      stream.current?.getTracks().forEach((t) => t.stop());
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  async function save(data: string) {
    const photo = { id: crypto.randomUUID(), data, at: new Date().toISOString() };
    await photos("save", photo);
    if (alive.current) setGallery((p) => [photo, ...p]);
  }
  async function start() {
    setError("");
    setBusy(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await Camera.getPhoto({
          quality: 80,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          saveToGallery: false,
        });
        if (photo.dataUrl) await save(photo.dataUrl);
      } else {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error();
        stop();
        const next = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (!alive.current) {
          next.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = next;
        if (video.current) {
          video.current.srcObject = next;
          await video.current.play();
        }
        setRunning(true);
      }
    } catch {
      stop();
      setError("تعذر فتح الكاميرا أو أُلغي الطلب. تحقق من إذن الكاميرا ثم أعد المحاولة.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function capture() {
    if (!video.current?.videoWidth) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.current.videoWidth;
      canvas.height = video.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.drawImage(video.current, 0, 0);
      await save(canvas.toDataURL("image/jpeg", 0.8));
      stop();
    } catch {
      setError("تعذر حفظ الصورة. قد تكون مساحة الجهاز ممتلئة.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        صورك محفوظة في هذا الجهاز فقط ولا تُرفع لخادم. حذف بيانات التطبيق يمسح المعرض؛ نزّل الصور
        للاحتفاظ بنسخة.
      </p>
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => void start()}
          className="min-h-12 rounded-xl bg-primary px-4 text-primary-fg"
        >
          فتح الكاميرا
        </button>
        {running && (
          <>
            <button
              disabled={busy}
              className="min-h-12 rounded-xl border border-border px-4"
              onClick={() => void capture()}
            >
              التقاط صورة
            </button>
            <button className="min-h-12 px-4" onClick={stop}>
              إيقاف
            </button>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        className={`w-full rounded-2xl bg-black ${running ? "" : "hidden"}`}
        aria-label="معاينة الكاميرا"
      />
      <h2 className="font-display text-xl">المعرض المحلي · {gallery.length}</h2>
      <div className="grid grid-cols-2 gap-3">
        {gallery.map((p) => (
          <figure key={p.id} className="overflow-hidden rounded-xl border border-border p-2">
            <img
              src={p.data}
              alt={`صورة ${new Date(p.at).toLocaleString("ar-SA")}`}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <figcaption className="text-xs text-muted">
              {new Date(p.at).toLocaleDateString("ar-SA")}
            </figcaption>
            <a
              href={p.data}
              download={`waha-${p.id}.jpg`}
              className="inline-block min-h-11 p-2 text-primary"
            >
              تنزيل
            </a>
            <button
              className="min-h-11 p-2 text-danger"
              onClick={() =>
                void photos("delete", p.id)
                  .then(() => setGallery((all) => all.filter((x) => x.id !== p.id)))
                  .catch(() => setError("تعذر حذف الصورة"))
              }
            >
              حذف
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
