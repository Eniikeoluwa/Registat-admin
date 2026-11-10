# Registat Admin

Standalone Next.js admin portal extracted from Registat-FE. The root URL redirects to `/admin/dashboard`, and all existing `/admin/...` URLs remain available.

## Run locally

Use Node.js 22 or newer. Set `API_URL` in an untracked `.env.local` file to the Registat backend base URL, including `/v1`. The server uses `NEXT_PUBLIC_API_URL` only as a fallback.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Sign in with an existing admin account. Customer signup is handled by the customer app; this portal does not create admin accounts.

## Checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

The portal includes its own auth routes, session guard, API proxy, admin pages, components, data, and assets. The backend must accept requests from this app's server through `API_URL`. Configure the deployment environment with the same variable before deploying.

## Live backend configuration

Copy `.env.example` to `.env.local` before starting the app:

```bash
cp .env.example .env.local
npm run dev
```

The live value is `API_URL=https://registat-be.onrender.com/v1`. The
`/v1/registat/` URL is documentation, not the API base. Restart the development
server after changing environment variables. Set `API_URL` in your hosting
provider's environment settings and redeploy for production. It stays on the
server; browsers use the same-origin `/api/auth/*` and `/api/registat/*` proxies,
so no public environment variable or browser CORS configuration is needed.

The portal uses the current staff API, including dedicated staff login, effective
permissions, customer creation/editing/history/exports, application drafts and case
management, document delivery/review/downloads, staff analytics/activity, compliance
requirements and filings, and Bachs payment reconciliation/recovery. Existing page
shells, CSS, cards and form controls are retained. See [admin API coverage](docs/admin-api-coverage.md).

Staff log in through `/v1/auth/admin-login`. Roles are `superAdmin` and `subAdmin`;
sub-admin assignments are `admin`, `finance`, `support`, and `compliance`. The effective
permission list returned by login controls navigation and actions. Access and refresh
tokens stay in HttpOnly cookies; a signed, identity-bound permission snapshot is rotated
with the refresh token. The backend rechecks the current identity/assignment and enforces
permissions on every protected call. Existing sessions must sign in again after this update.

Email verification uses `{email, token, code}` and reset uses
`{email, token, code, password}`. UUID challenges are kept in session storage (with an
in-memory fallback), never added to URLs. Codes are delivered by email. New staff
creation and sensitive mutations require a recent login. A customer created by staff
sets their own password through Forgot password; if welcome email enqueue fails, resend
it from their account instead of creating the account again.

Exports return HTTP 202 acknowledgements: the backend generates and emails the CSV.
Dashboard amounts are exact minor-unit strings, formatted without Number rounding.
USD/NGN revenue stays separate. Bachs collected amounts are decimal strings and are
shown separately from the frozen charge. Historical Paystack records remain readable;
the current backend cannot reconcile them through Bachs. Invoices, refunds, stored
cards, recurring payments, general audit logs and notification preference APIs remain
unavailable.

To refresh the proxy allowlist and validation schemas from the live OpenAPI docs:

```bash
node scripts/sync-api-contracts.mjs
# Or use a previously downloaded OpenAPI JSON:
node scripts/sync-api-contracts.mjs /path/to/openapi.json
```

Authentication and admin-only flows require an existing admin account; credentials
are not stored in environment files. Do not put access tokens, refresh tokens, or
Paystack secret keys in frontend environment variables.
