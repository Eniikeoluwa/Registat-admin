# Registat Admin

Base Next.js application for the Registat admin portal, using TypeScript, App Router, Tailwind CSS and ESLint.

## Getting started

Use Node.js 22 or newer. From this directory:

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Commands

```bash
npm run dev         # Start the development server
npm run lint        # Run ESLint
npm run type-check  # Generate route types and check TypeScript
npm run build       # Create a production build
npm start           # Serve the production build
```

## Structure

- `src/app/` — Routes, root layout and global styles.
- `@/*` — Import alias for `src/*`.

This starter contains a placeholder home page. Authentication, API integration and admin features will be added separately.
