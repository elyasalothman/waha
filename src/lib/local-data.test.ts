import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { clearWahaLocalData } from "./local-data.ts";

// Browser Storage exposes stored keys as enumerable own properties.
class MemoryStorage {
  constructor(values: Record<string, string>) {
    Object.assign(this, values);
  }
  removeItem(key: string) {
    Reflect.deleteProperty(this, key);
  }
}

function install(t: TestContext, values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
}

async function createDatabase(factory: IDBFactory, name: string) {
  await new Promise<void>((resolve, reject) => {
    const request = factory.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

test("data reset deletes owned databases, caches and storage while preserving unrelated data", async (t) => {
  const factory = new IDBFactory();
  for (const name of ["waha-private-books-v1", "waha-book-studio-v1", "waha-camera", "other-app"])
    await createDatabase(factory, name);
  const local = new MemoryStorage({
    "waha:budget": "private",
    "waha-settings": "private",
    other: "keep",
    wahaha: "keep",
  });
  const session = new MemoryStorage({ "waha:session": "private", "other:session": "keep" });
  const entries = new Set([
    "waha-public-v5",
    "waha:images",
    "other-app",
    "wahaha-public-v1",
    "wahaBackup",
  ]);
  const cacheStorage = {
    keys: async () => [...entries],
    delete: async (key: string) => entries.delete(key),
  };
  install(t, {
    indexedDB: factory,
    window: { caches: cacheStorage },
    caches: cacheStorage,
    localStorage: local,
    sessionStorage: session,
  });

  await clearWahaLocalData();

  assert.deepEqual(
    (await factory.databases()).map((db) => db.name),
    ["other-app"],
  );
  assert.deepEqual([...entries], ["other-app", "wahaha-public-v1", "wahaBackup"]);
  assert.deepEqual(Object.keys(local), ["other", "wahaha"]);
  assert.deepEqual(Object.keys(session), ["other:session"]);
  assert.equal(Reflect.get(local, "other"), "keep");
  assert.equal(Reflect.get(session, "other:session"), "keep");
  await clearWahaLocalData(); // Repeated resets remain safe.
  assert.deepEqual([...entries], ["other-app", "wahaha-public-v1", "wahaBackup"]);
});

test("data reset works when CacheStorage is unavailable", async (t) => {
  const local = new MemoryStorage({ "waha:budget": "private", other: "keep" });
  const session = new MemoryStorage({ "waha-session": "private" });
  install(t, {
    indexedDB: new IDBFactory(),
    window: {},
    localStorage: local,
    sessionStorage: session,
  });
  await clearWahaLocalData();
  assert.deepEqual(Object.keys(local), ["other"]);
  assert.deepEqual(Object.keys(session), []);
});

for (const event of ["onblocked", "onerror"] as const) {
  test(`data reset reports ${event} and leaves remaining storage intact`, async (t) => {
    const failure = new Error("database deletion failed");
    const calls: string[] = [];
    const factory = {
      deleteDatabase(name: string) {
        calls.push(name);
        const request = {
          error: failure,
          onblocked: null as null | (() => void),
          onerror: null as null | (() => void),
        };
        queueMicrotask(() => request[event]?.());
        return request;
      },
    };
    const local = new MemoryStorage({ "waha:budget": "keep until databases are cleared" });
    const cacheStorage = {
      keys: async () => {
        assert.fail("must stop before clearing caches");
      },
    };
    install(t, {
      indexedDB: factory,
      window: { caches: cacheStorage },
      caches: cacheStorage,
      localStorage: local,
      sessionStorage: new MemoryStorage({}),
    });
    await assert.rejects(clearWahaLocalData(), event === "onerror" ? failure : /أغلق تبويبات/);
    assert.deepEqual(calls, ["waha-private-books-v1"]);
    assert.equal(Reflect.get(local, "waha:budget"), "keep until databases are cleared");
  });
}
