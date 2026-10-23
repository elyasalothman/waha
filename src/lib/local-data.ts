/** Only Waha-owned data; never clears unrelated origin keys. Called after explicit UI confirmation. */
export async function clearWahaLocalData() {
  for (const name of ["waha-private-books-v1", "waha-book-studio-v1", "waha-camera"]) {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("أغلق تبويبات واحة الأخرى ثم أعد المحاولة"));
    });
  }
  if ("caches" in window)
    for (const key of await caches.keys()) if (/^waha[:-]/.test(key)) await caches.delete(key);
  for (const storage of [localStorage, sessionStorage])
    for (const key of Object.keys(storage)) if (/^waha[:-]/.test(key)) storage.removeItem(key);
}
