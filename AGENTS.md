<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dev Commands

```bash
npm run dev         # Start dev server (http://localhost:3000)
npm run build       # Production build
npm run lint        # ESLint (flat config, see eslint.config.mjs)
npm run test        # Run vitest tests
npm run test:watch  # Vitest in watch mode
```

## Supabase Backend

- **Project ID**: `oohcojwplgmmefjmiyle`
- **URL**: `https://oohcojwplgmmefjmiyle.supabase.co`
- **Service role key** and **anon key** are in `.env.local` (DO NOT commit)

## Environment Setup

Copy `.env.example` to `.env.local` and fill in Supabase credentials before running.

## Database Migrations

Migrations live in `supabase/migrations/`. Run via Supabase CLI:
```bash
npx supabase migration run
```

## User Management

```bash
node create-user.js     # Create admin user via Supabase Auth API (uses hardcoded service role key)
```

## Architecture

- Next.js 16 App Router with route groups: `(auth)` and `(dashboard)`
- State: Zustand (`src/store/`)
- DB access: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- UI components: Radix UI primitives in `src/components/ui/`
- Forms: react-hook-form + zod + @hookform/resolvers

## Database Schema (key tables)

`gyms`, `class_templates`, `membership_plans`, `user_profiles`, `athletes`, `coaches`, `classes`, `schedules`, `attendance`, `tickets`, `notifications`

RLS enabled on all tables. Service role key bypasses RLS for admin scripts.

## Auth Proxy

All requests pass through `src/proxy.ts` which handles Supabase SSR cookie auth and redirects unauthenticated users to `/login`. Public routes: `/login`, `/forgot-password`, `/reset-password`.

## Tailwind CSS

v4 with `@tailwindcss/postcss` — no `tailwind.config.js` needed (config is in CSS).

## Agent skills

### Issue tracker

GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at repo root + `docs/adr/`. See `docs/agents/domain.md`.

## Supabase SSR Cookie Pattern

Use `@supabase/ssr` `createServerClient` for Server Components and Route Handlers. Use `@supabase/supabase-js` `createClient` for client-side only.