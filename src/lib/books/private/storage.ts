import {
  MAX_BOOKS,
  namedError,
  type BookContent,
  type PrivateBook,
  type ReadingState,
} from "./model.ts";

export const PRIVATE_BOOKS_DB = "waha-private-books-v1";
const stores = ["books", "content", "reading"] as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(namedError("StorageUnavailableError"));
    const request = indexedDB.open(PRIVATE_BOOKS_DB, 1);
    request.onupgradeneeded = () => {
      for (const name of stores)
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? namedError("StorageUnavailableError"));
    request.onblocked = () => reject(namedError("StorageUnavailableError"));
  });
}

async function transact<T>(
  names: (typeof stores)[number][],
  mode: IDBTransactionMode,
  action: (tx: IDBTransaction, done: (value: T) => void, fail: (error: unknown) => void) => void,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(names, mode);
    let value: T;
    let failure: unknown;
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(failure ?? tx.error ?? namedError("StorageUnavailableError"));
    };
    try {
      action(
        tx,
        (result) => {
          value = result;
        },
        (error) => {
          failure = error;
          tx.abort();
        },
      );
    } catch (error) {
      tx.abort();
      db.close();
      reject(error);
    }
  });
}

export function listPrivateBooks(): Promise<PrivateBook[]> {
  return transact(["books"], "readonly", (tx, done) => {
    tx.objectStore("books").getAll().onsuccess = (event) =>
      done(
        ((event.target as IDBRequest).result as PrivateBook[]).sort(
          (a, b) => b.addedAt - a.addedAt,
        ),
      );
  });
}

export function getPrivateBook(
  id: string,
): Promise<{ book?: PrivateBook; content?: BookContent; reading?: ReadingState }> {
  return transact([...stores], "readonly", (tx, done) => {
    const result: { book?: PrivateBook; content?: BookContent; reading?: ReadingState } = {};
    tx.objectStore("books").get(id).onsuccess = (event) => {
      result.book = (event.target as IDBRequest).result;
    };
    tx.objectStore("content").get(id).onsuccess = (event) => {
      result.content = (event.target as IDBRequest).result;
    };
    tx.objectStore("reading").get(id).onsuccess = (event) => {
      result.reading = (event.target as IDBRequest).result;
    };
    done(result);
  });
}

export async function savePrivateBook(book: PrivateBook, content: BookContent): Promise<string> {
  return transact(["books", "content"], "readwrite", (tx, done, fail) => {
    // Read + dedupe + count + writes share one serialized transaction.
    const request = tx.objectStore("books").getAll();
    request.onsuccess = () => {
      try {
        const existing = request.result as PrivateBook[];
        const duplicate = existing.find(
          (row) => row.contentDigest === book.contentDigest || row.id === book.id,
        );
        if (duplicate) {
          done(duplicate.id);
          return;
        }
        if (existing.length >= MAX_BOOKS) {
          fail(namedError("BookLimitError"));
          return;
        }
        tx.objectStore("books").add(book);
        tx.objectStore("content").add(content);
        done(book.id);
      } catch (error) {
        fail(error);
      }
    };
  });
}

export function saveReading(state: ReadingState): Promise<void> {
  return transact(["books", "reading"], "readwrite", (tx, done) => {
    const request = tx.objectStore("books").get(state.id);
    request.onsuccess = () => {
      if (request.result) tx.objectStore("reading").put(state);
      done(undefined);
    };
  });
}

export function deletePrivateBook(id: string): Promise<void> {
  return transact([...stores], "readwrite", (tx, done) => {
    for (const name of stores) tx.objectStore(name).delete(id);
    done(undefined);
  });
}
