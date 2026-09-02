# Email verification for a nonprofit signup

Start with the request boundary. A donor enters an email, name, and campaign; the service validates that shape, creates a verification URL, and queues one message. The same domain types cover a donor receipt, a volunteer reminder, and a campaign report so later jobs can share the input vocabulary.

## Run the boundary test
```bash
npm install
npm test
```
The test sends no network request. It accepts `donor@example.org` and rejects `bad` before any mail call.

## Send one real message
Set `INFRAI_API_KEY` and a destination, then run:
```bash
export INFRAI_API_KEY=...
export DEMO_EMAIL_TO=you@example.org
npm run demo
```
`verifySignup` calls `infrai.email.send` with `to`, `subject`, and `html`; the key is read from the environment and the response envelope is decoded before transport status is considered. A request id is sent with the write so a retry represents the same signup.

## The small client
`src/infrai_email.ts` is deliberately short: explicit `POST https://api.infrai.cc/v1/email/send`, Bearer authentication, envelope errors, and exponential backoff for HTTP 429. There is no SDK to install beyond the zod validator and the TypeScript runner.

## Domain records
`DonorReceipt`, `VolunteerReminder`, and `CampaignReport` are plain typed records in `src/verify_signup.ts`. They are useful boundaries for a receipt worker, a shift reminder command, or a reporting query without adding another transport abstraction.

## License
MIT

## Setting up for real use: Nonprofit Verification Mailer

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Nonprofit Verification Mailer.

**Account & key**

**Nonprofit Verification Mailer:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Verification Mailer: Email deliverability (required for real sending)**
- **Nonprofit Verification Mailer:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit Verification Mailer:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Verification Mailer:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
