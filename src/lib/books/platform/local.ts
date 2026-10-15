import { validateBook, type ReadingBook } from "./model.ts";
const DB = "waha-book-studio-v1";
async function operation<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("drafts", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error("أغلق التبويبات الأخرى لإتاحة التخزين."));
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", mode);
    const request = action(tx.objectStore("drafts"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("تعذّر حفظ الكتاب على الجهاز."));
    };
  });
}
export const listDrafts = () => operation<ReadingBook[]>("readonly", (s) => s.getAll());
export const getDraft = (id: string) =>
  operation<ReadingBook | undefined>("readonly", (s) => s.get(id));
export const deleteDraft = (id: string) => operation("readwrite", (s) => s.delete(id));
export const saveDraft = (book: ReadingBook) =>
  operation("readwrite", (s) => s.put(validateBook(book)));
