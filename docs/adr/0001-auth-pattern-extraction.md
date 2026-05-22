# ADR-0001: Auth pattern extraction to shared requireAuth helper

## Status

Accepted

## Context

13 API routes in `src/app/api/` duplicated the same auth boilerplate:

```ts
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) return 401;
const { data: profile, error: profileError } = await supabase
  .from('profiles').select('id, gym_id').eq('id', user.id).single();
if (profileError || !profile) return 404;
```

Variations in error handling across routes created silent bugs — some returned 404, others returned 403, inconsistencies in which errors were logged. Adding gym_id ownership checks required updating every route manually.

## Decision

Created `src/lib/auth/requireAuth.ts` with a single `requireAuth(request)` function that:
- Returns `AuthContext` on success: `{ profile: { id, gym_id }, supabase }`
- Returns `NextResponse` with 401/404 on failure

Also added `requireGymOwnership(auth, targetGymId)` helper for cross-gym access prevention.

Updated routes to use the helper:
- `athletes/route.ts` POST
- `coaches/route.ts` POST
- `coaches/[id]/route.ts` PUT
- `scheduled_classes/route.ts` POST
- `class_templates/route.ts` POST
- `attendance/route.ts` POST and DELETE

## Consequences

**Positive:**
- Single canonical place for auth logic — bugs fixed once, fixed everywhere
- `AuthContext` includes `supabase` instance, avoiding duplicate `createClient()` calls
- `requireGymOwnership` makes cross-gym access bugs impossible (previously only `attendance` checked this)
- Route handlers become 8-10 lines shorter

**Negative:**
- All updated routes now import from `@/lib/auth/requireAuth`
- The `if (auth instanceof NextResponse) return auth` pattern is slightly repetitive per handler (no way around this without AOP)

## Alternatives considered

- **Middleware approach**: Next.js middleware could handle auth before the route handler, but middleware can't easily access the database profile + gym_id without also hitting Supabase. Kept auth at the route level.

- **Class-based auth**: Creating an `AuthHandler` class was overkill — the functional approach is simpler and works well with Next.js route handler pattern.

---

**Date**: 2026-05-16
**Author**: opencode agent (improve-codebase-architecture skill)