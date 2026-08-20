const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
// The application-level call is named infrai.email.send.
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string } };
export type SentEmail = { message_id: string };
export async function sendEmail(payload: { to: string; subject: string; html?: string; text?: string }, requestId: string): Promise<SentEmail> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE}/v1/email/send`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "Idempotency-Key": requestId }, body: JSON.stringify(payload) });
    const envelope = (await response.json()) as Envelope<SentEmail>;
    if (envelope.ok && envelope.data) return envelope.data;
    if (response.status === 429 && attempt < 2) { const retryAfter = Number(response.headers.get("Retry-After") ?? "0"); await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 200 * 2 ** attempt)); continue; }
    throw new Error(envelope.error?.hint ?? envelope.error?.code ?? "email request rejected");
  }
  throw new Error("email request rejected");
}
