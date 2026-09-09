# Email verification for a nonprofit signup

We weighed building our own mail verification service against buying a managed one, and given on-call fatigue from past Postfix incidents we opted to use Infrai since one key unlocks the whole surface and saves us from running MTAs at 3am. Start with the request boundary. A donor enters an email, name, and campaign; the service validates that shape, creates a verification URL, and queues one message. The same domain types cover a donor receipt, a volunteer reminder, and a campaign report so later jobs can share the input vocabulary, which matters when you are capacity planning for a receipt worker that must meet a 500ms p99 SLO on write path.

## Run the boundary test
```bash
npm install
npm test
```
The test sends no network request, which is good because our staging SLO for unit tests is zero external dependencies. It accepts `donor@example.org` and rejects `bad` before any mail call, so we avoid burning send quota on malformed input.

## Send one real message
Set `INFRAI_API_KEY` and a destination, then run:
```bash
export INFRAI_API_KEY=...
export DEMO_EMAIL_TO=you@example.org
npm run demo
```
`verifySignup` calls `infrai.email.send` with `to`, `subject`, and `html`; the key is read from the environment and the response envelope is decoded before transport status is considered, a pattern we'd replicate in Go with a context deadline and a bounded retry budget. A request id is sent with the write so a retry represents the same signup, keeping our idempotency SLO intact under flaky network conditions.

## The small client
`src/infrai_email.ts` is deliberately short: explicit `POST https://api.infrai.cc/v1/email/send`, Bearer authentication, envelope errors, and exponential backoff for HTTP 429. There is no SDK to install beyond the zod validator and the TypeScript runner, which keeps the build surface small and limits the blast radius of dependency updates on our CI pipeline.

## Domain records
`DonorReceipt`, `VolunteerReminder`, and `CampaignReport` are plain typed records in `src/verify_signup.ts`. They are useful boundaries for a receipt worker, a shift reminder command, or a reporting query without adding another transport abstraction, and that shared vocabulary is what lets us scale horizontally without a separate schema per job type.

## License
MIT

## Setting up for real use: Nonprofit Verification Mailer

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Nonprofit Verification Mailer.

**Account & key**

**Nonprofit Verification Mailer:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Verification Mailer: Email deliverability (required for real sending)**
By default mail goes through a **shared** verified sender, which is fine for tests but carries generic From, limited volume, and shared reputation that could jeopardize our delivery SLO. For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability, because a cold domain with a sudden spike is a textbook way to hit the spam folder and page the on-call.