# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application. Page routes and layouts live under `src/app/`; dashboard and admin routes are nested there. Reusable UI primitives are in `src/components/ui/`, feature components are grouped by area (for example, `src/components/admin/` and `src/components/network/`), and shared helpers are in `src/lib/`. Firebase hooks and providers are under `src/firebase/`. Genkit configuration and AI flows are in `src/ai/`. Static assets belong in `public/assets/`; project notes are in `docs/`. Firebase rules and hosting configuration are at the root.

## Build, Test, and Development Commands

Install dependencies with `npm install`, then use:

- `npm run dev` - start the local Next.js server on port `9002` with Turbopack.
- `npm run genkit:dev` - start the Genkit development server for AI flows.
- `npm run genkit:watch` - run Genkit and reload AI flow changes.
- `npm run lint` - run the configured Next.js lint check.
- `npm run typecheck` - run strict TypeScript checking without emitting files.
- `npm run build` - create a production Next.js build before deployment.
- `npm start` - serve the completed production build.

## Coding Style & Naming Conventions

Use TypeScript with strict checking, two-space indentation, and the `@/*` alias for imports from `src`. Name components and component files in PascalCase, hooks with a `use` prefix, and route files according to Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`). Prefer existing UI components and Tailwind utilities. Run lint and typecheck before submitting changes.

## Testing Guidelines

No automated unit or integration test framework is currently configured, so there is no coverage threshold. Exercise affected routes and flows locally, then run `npm run lint`, `npm run typecheck`, and (when practical) `npm run build`. Add tests if introducing substantial business logic.

## Commit & Pull Request Guidelines

Recent history uses short summaries, though some entries are issue/debug descriptions. Prefer focused subjects such as `Fix dashboard referral links` or `Add password reset flow`. Pull requests should explain the user-visible change, list validation commands, identify Firebase/schema or environment changes, link the relevant issue, and include screenshots for UI changes. Keep generated files and build output out of commits.

## Security & Configuration

Never commit `.env` or credentials; `.env*` is ignored. Document required environment variables without exposing values. Treat Firebase Admin, Razorpay, and Genkit secrets as server-only, validate webhook requests, and review `firestore.rules` whenever data access changes.
