import { FAMILY_SYNC_STUB, type SyncStub } from "@/lib/messages";

export async function requestFamilySync(): Promise<SyncStub> {
  try {
    const res = await fetch("/api/family-inbox", { method: "POST" });
    if (!res.ok) return FAMILY_SYNC_STUB;
    const body = (await res.json()) as Partial<SyncStub>;
    if (body.status === "stub") {
      return {
        ok: false,
        status: "stub",
        messageAr: body.messageAr ?? FAMILY_SYNC_STUB.messageAr,
        messageEn: body.messageEn ?? FAMILY_SYNC_STUB.messageEn,
      };
    }
  } catch {
    /* offline — still honest */
  }
  return FAMILY_SYNC_STUB;
}
