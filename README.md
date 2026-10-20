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
