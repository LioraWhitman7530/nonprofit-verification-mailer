import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sendEmail, type SentEmail } from "./infrai_email.js";
export const signupSchema = z.object({ email: z.string().email(), donorName: z.string().min(1), campaign: z.string().min(1) });
export type Signup = z.infer<typeof signupSchema>;
export type DonorReceipt = { donorName: string; campaign: string; amountCents: number; receiptId: string };
export type VolunteerReminder = { email: string; shift: string; startsAt: string };
export type CampaignReport = { campaign: string; verified: number; receipts: number };
export async function verifySignup(input: unknown): Promise<SentEmail> { const signup = signupSchema.parse(input); const token = randomUUID(); const link = `https://example.org/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(signup.email)}`; return sendEmail({ to: signup.email, subject: `Verify your ${signup.campaign} signup`, html: `<p>Hello ${signup.donorName},</p><p>Confirm your email: <a href="${link}">${link}</a></p>` }, `signup-${token}`); }
if (process.argv[1]?.endsWith("verify_signup.ts")) { const email = process.env.DEMO_EMAIL_TO; if (!email) throw new Error("DEMO_EMAIL_TO is required"); const result = await verifySignup({ email, donorName: "Demo donor", campaign: "Community drive" }); console.log(`verification email queued: ${result.message_id}`); }
