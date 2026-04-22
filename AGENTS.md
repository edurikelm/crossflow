<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dev Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

Note: No `test` or `typecheck` scripts defined in package.json. Add them if needed.

## Supabase Backend

- **Project ID**: `oohcojwplgmmefjmiyle`
- **URL**: `https://oohcojwplgmmefjmiyle.supabase.co`
- **Service role key** and **anon key** are in `.env.local` (DO NOT commit)

### API Testing Scripts

```powershell
.\check_all.ps1   # GET gyms + class_templates
.\check_api.ps1    # GET membership_plans
```

### Database Migrations

Migrations live in `supabase/migrations/`. Run via Supabase CLI:
```bash
npx supabase migration run
```

### User Management

```bash
node create-user.js     # Create admin user via Supabase Auth API
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

## Environment

Copy `.env.example` to `.env.local` and fill in Supabase credentials before running.
