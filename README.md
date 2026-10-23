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

Users, companies, applications, catalogue/pricing, payments, and notifications use
live APIs. Dashboard totals come from paginated admin application metadata, and
notifications are scoped to the signed-in account. No demo fallback is used on
these screens. Compliance, invoices/refunds/manual payments, profile editing,
admin invitations and audit logs have no documented backend implementation and
show availability notices. Admin document downloads remain owner-restricted;
verification/password-reset token delivery also requires backend work.

To refresh the proxy allowlist and validation schemas from the live OpenAPI docs:

```bash
node scripts/sync-api-contracts.mjs
# Or use a previously downloaded OpenAPI JSON:
node scripts/sync-api-contracts.mjs /path/to/openapi.json
```

Authentication and admin-only flows require an existing admin account; credentials
are not stored in environment files. Do not put access tokens, refresh tokens, or
Paystack secret keys in frontend environment variables.
