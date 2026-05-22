# ADR-0002: Athlete Status Model — status_override + cálculo on-read

## Status

Accepted

## Context

El `Athlete` solo tenía `is_active: boolean` — siempre `true` al crearse, nunca se
toggled por UI. El `Membership` tenía su propio `status` (active | paused | expired |
cancelled), y el badge visible en la UI combinaba ambos campos en lógica cliente.
Esto causaba:

- **Inconsistencia**: el filtro de la UI usaba `is_active` para "Activos/Inactivos",
  pero la API mapeaba "Inactivos" a `membership.status = 'expired'`.
- **Sin granularidad**: no existían trial, suspended, ni paused a nivel atleta.
- **Dos fuentes de verdad**: `athlete.is_active` vs `membership.status` podían
  decir cosas distintas sin reglas claras de resolución.

## Decision

Modelamos el estado del atleta como un **AthleteStatus** unificado de 6 valores
(active | trial | expired | paused | suspended | inactive), implementado así:

1. **`athletes.status_override`** — nullable enum (`trial`, `paused`, `suspended`,
   `inactive`). Lo pone el admin manualmente. Si no es null, **gana** sobre cualquier
   cálculo automático.

2. **`athletes.trial_ends_at`** — date opcional. Si el override es `trial` y esta
   fecha venció, el sistema lo mueve a `expired`.

3. **Cálculo on-read** — `active` y `expired` nunca se persisten. Se calculan en
   cada consulta: si `status_override` es null y la Membership más reciente está
   vigente → `active`; si no → `expired`.

4. **`membership.status`** se elimina. La tabla `memberships` queda como registro
   contractual puro (start_date, end_date, plan_id, classes_used, auto_renew).

5. **Prioridad**: manual (`suspended`, `inactive`, `paused`, `trial`) > automático
   (`expired`, `active`). Un admin que puso `suspended` no se sobrescribe aunque
   la membresía esté al día.

## Consequences

**Positive:**
- Un solo source of truth para el estado del atleta
- El admin tiene control explícito (suspended, paused) sin que el sistema lo pisotee
- El cálculo on-read evita desincronización y jobs nocturnos
- El filtro, badge, API, y métricas hablan el mismo lenguaje

**Negative:**
- Hay que migrar datos existentes (is_active + membership.status → status_override)
- El cálculo on-read depende de que la query siempre incluya la membresía más reciente
- Cambiar el estado manualmente puede cancelar bookings futuros (efecto colateral)

## Alternatives considered

- **Persistir el status calculado**: requeriría un trigger o cron job para
  recalcular en cada cambio de membresía. Riesgo de desincronización. Descartado
  por simplicidad: on-read es más fácil de testear y mantener.

- **Mantener `membership.status` como source of truth**: el status del atleta sería
  un derivado de la membresía, sin override manual posible. No cubre casos como
  suspensión disciplinaria (no relacionada con la membresía). Descartado.

- **Boolean + más campos**: agregar `is_suspended`, `is_paused`, etc. como booleans
  separados. Frágil: ¿qué pasa si dos son true al mismo tiempo? Un enum con
  override explícito es más robusto.

---

**Date**: 2026-05-22
**Author**: opencode agent (grill-with-docs skill)
