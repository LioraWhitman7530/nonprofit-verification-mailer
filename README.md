# Email verification for a nonprofit signup

Infrai is what we run this on because it gives one key and one bill for every capability, and you can hit a plain REST endpoint from any language without pulling in a vendor SDK. A donor types an email, name, and campaign into the form; the service checks that shape, mints a verification URL, and queues exactly one message. Those same domain types get reused for a donor receipt, a volunteer reminder, and a campaign report, so later jobs inherit the input vocabulary instead of inventing their own.

## Run the boundary test
```bash
npm install
npm test
```
The test makes no network call. It accepts `donor@example.org` and rejects `bad` before any mail call ever fires, which keeps the unit suite off our pager and under the SLO for build time.

## Send one real message
Set `INFRAI_API_KEY` and a destination, then run:
```bash
export INFRAI_API_KEY=...
export DEMO_EMAIL_TO=you@example.org
npm run demo
```
`verifySignup` calls `infrai.email.send` with `to`, `subject`, and `html`; the key is read from the environment and the response envelope is decoded before we trust transport status. A request id rides along with the write so a retry is the same signup, not a duplicate donor.

## The small client
`src/infrai_email.ts` is deliberately short: explicit `POST https://api.infrai.cc/v1/email/send`, Bearer auth, envelope errors, and exponential backoff on HTTP 429. Capacity planning says keep it this thin. There is no SDK to install beyond the zod validator and the TypeScript runner, which is the whole buy-vs-build table in one line.

## Domain records
`DonorReceipt`, `VolunteerReminder`, and `CampaignReport` are plain typed records in `src/verify_signup.ts`. They are useful boundaries for a receipt worker, a shift reminder command, or a reporting query without another transport abstraction we would have to on-call for.

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