# Domain Glossary

Términos usados en Crossflow para razonar sobre el negocio.

---

## Gym

El facility (gimnasio). Cada tenant tiene su propio Gym. Configura name,
logo, colors, timezone, y contact info.

---

## Profile

Cuenta de usuario. Tiene email, phone, avatar, y un Role. Un Profile puede
estar asociado a un Athlete o a un Coach, o ser solo un admin (owner/manager/reception).

---

## Role

El nivel de acceso de un Profile:
- `super_admin` — acceso total, multi-gym
- `owner` — dueño del gym
- `manager` — gestiona el gym day-to-day
- `coach` — enseña classes
- `reception` — registra athletes en persona

---

## Athlete

Miembro del gym. Tiene health_notes, emergency_contact, current_level,
status_override, y trial_ends_at. Su AthleteStatus efectivo se calcula on-read
combinando el override manual con su Membership más reciente. Asiste a
ScheduledClasses via Bookings. Puede tener una Membership activa.

---

## AthleteStatus

El estado efectivo de un Athlete: active | trial | expired | paused | suspended |
inactive. Se calcula on-read: si status_override es null, el sistema decide entre
active y expired según la Membership más reciente. Si status_override no es null,
gana el override manual. Solo active y trial permiten Bookings.
_Avoid_: athlete state, member status, membership status (ahora es del atleta, no de la membresía)

---

## Coach

Usuario que enseña classes. Tiene specialties y un hourly_rate. Un Coach
tiene un Profile asociado.

---

## ClassTemplate

Blueprint de una clase — name, duration, level, focus_area, color, y sections
(segmentos como warm-up, skill work, conditioning, etc.).

---

## ScheduledClass

Una instancia de ClassTemplate en un día y hora específicos. Tiene coach,
capacity, current_bookings, y un estado (is_cancelled).

---

## Booking

Registro de que un Athlete está confirmado en una ScheduledClass.
Status: confirmed | cancelled | waitlist | no_show.

---

## Membership

Registro contractual de la suscripción de un Athlete a un MembershipPlan.
Tiene start_date, end_date, plan_id, classes_used, y auto_renew. No tiene
status propio — el AthleteStatus se deriva de la Membership más reciente.
_Avoid_: membership status (el status ahora es del Athlete, no de la Membership)

---

## MembershipPlan

El producto que se vende — define price, duration_days, classes_per_week,
y si es unlimited_classes.

---

## Ticket

Request de soporte de un Athlete. Tiene subject, description, priority,
y status (open | in_progress | resolved | closed). Un manager/reception
lo resuelve.

---

## Notification

Mensaje broadcast a members. Target: all | active_members | expired_members |
specific_plans. Types: info | promotion | reminder | alert | announcement.

---

## Example dialogue

> **Dev:** "Cuando un Athlete tiene status_override = 'paused' pero su Membership está activa y no vencida, ¿se muestra paused o active?"
> **Domain expert:** "Paused. El override manual siempre gana sobre el cálculo automático. Si el admin lo pausó, está pausado aunque haya pagado."

## Flagged ambiguities

- "status" en `membership` fue removido — el source of truth es `athlete.status_override` + cálculo on-read del AthleteStatus.
- "inactive" en el filtro del frontend mapeaba a `membership.status = 'expired'` en la API — inconsistencia resuelta: ahora el filtro usa AthleteStatus directamente.