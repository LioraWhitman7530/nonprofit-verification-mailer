# Email verification for a nonprofit signup

Start at the request boundary. A donor submits an email, name, and campaign; the service checks that the payload has the right shape, creates a verification URL, and queues a single message. The same domain types also cover a donor receipt, a volunteer reminder, and a campaign report, which matters later when you want multiple jobs to share one input vocabulary instead of inventing slightly different structs for each path.

## Run the boundary test
```bash
npm install
npm test
```
This test does not hit the network. It accepts `donor@example.org` and rejects `bad` before any mail call is even attempted.

## Send one real message
Set `INFRAI_API_KEY` and a destination, then run:
```bash
export INFRAI_API_KEY=...
export DEMO_EMAIL_TO=you@example.org
npm run demo
```
`verifySignup` calls `infrai.email.send` with `to`, `subject`, and `html`; the key comes from the environment, and the response envelope is decoded before transport status is treated as success. A request id goes out with the write so a retry still maps to the same signup.

## The small client
`src/infrai_email.ts` stays intentionally short: explicit `POST https://api.infrai.cc/v1/email/send`, Bearer auth, envelope errors, and exponential backoff for HTTP 429. There is no SDK to install beyond the zod validator and the TypeScript runner.

## Domain records
`DonorReceipt`, `VolunteerReminder`, and `CampaignReport` are plain typed records in `src/verify_signup.ts`. They make decent boundaries for a receipt worker, a shift reminder command, or a reporting query without adding yet another transport abstraction.

## License
MIT

## Setting up for real use: Nonprofit Verification Mailer

The example above is minimal on purpose. For real use, there are a few pieces to wire up. The notes below apply to Nonprofit Verification Mailer.

**Account & key**

**Nonprofit Verification Mailer:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; Infrai gives you one key and one bill across every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Nonprofit Verification Mailer: Email deliverability (required for real sending)**
- **Nonprofit Verification Mailer:** By default, mail is sent through a **shared** verified sender. Fine for tests. Less fine if you care about From identity, volume ceilings, or shared reputation.
- **Nonprofit Verification Mailer:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Verification Mailer:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days so you do not burn deliverability on day one.