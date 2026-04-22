# Design System Strategy: The Kinetic Archive

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **Industrial Precision**.

We are moving away from the "generic fitness app" aesthetic and toward a high-end, editorial performance ledger. This system captures the raw, visceral energy of a CrossFit "box"—concrete, steel, and sweat—but filters it through a sophisticated, data-heavy lens.

To break the "template" look, we utilize **Intentional Asymmetry**. Headlines should feel oversized and authoritative, often bleeding toward the edges of the container, while data points are nested in rigorous, tonal grids. We use overlapping elements—such as "floating" glass modules over high-contrast typography—to create a sense of depth and architectural layering that feels both rugged and premium.

## 2. Colors: High-Octane Contrast
The palette is rooted in a "Dark-First" philosophy, using deep slates to allow our action colors to vibrate with intensity.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be defined solely through background color shifts or tonal transitions.
*   Use `surface_container_low` (#1c1b1b) to house content on a `surface` (#131313) background.
*   The human eye perceives the shift in value as a structural change without the visual "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create "nested" depth:
*   **Base:** `surface_container_lowest` (#0e0e0e) for the deep background.
*   **Primary Work Area:** `surface` (#131313).
*   **Modules/Cards:** `surface_container_low` (#1c1b1b) or `surface_container_high` (#2a2a2a).
*   **Active Overlays:** `surface_bright` (#393939) with a 20% opacity `surface_tint` (#ffb3b6).

### The "Glass & Gradient" Rule
To add "soul" to the industrial aesthetic, use subtle gradients for primary CTAs. Transition from `primary_container` (#e11d48) to a darker custom shade to create a 3D metallic sheen.
*   **Glassmorphism:** For floating action buttons or modal overlays, use semi-transparent surface colors with a `backdrop-filter: blur(12px)`. This integrates the UI into the background rather than looking like a detached sticker.

## 3. Typography: The Performance Scale
The contrast between the Display and Body faces is where the "High-End Editorial" feel lives.

*   **Display & Headlines (Space Grotesk):** This is our "Industrial" face. It should be used at heavy weights (Bold/ExtraBold). Headlines should be set with tight letter-spacing (-2% to -4%) to evoke the cramped, high-pressure environment of a scoreboard.
*   **Body & Utility (Inter):** This is our "Functional" face. Inter provides a clean, Swiss-style legibility that balances the aggression of the headlines.
*   **The Hierarchy Goal:** Use `display-lg` (3.5rem) for workout titles or hero stats to command immediate attention, then drop immediately to `body-md` (0.875rem) for metadata. This "Extreme Contrast" is a hallmark of premium editorial design.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "soft" for this system. We use **Tonal Layering** to achieve lift.

*   **The Layering Principle:** Place a `surface_container_high` card on a `surface` background. The slight lift in brightness provides all the hierarchy needed.
*   **Ambient Shadows:** If a floating effect is required (e.g., a Workout Timer), use an extra-diffused shadow.
    *   *Color:* Use a tinted version of `on_surface` at 6% opacity.
    *   *Blur:* 32px or higher.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in data-heavy tables, use `outline_variant` (#5c3f40) at **15% opacity**. Never use 100% opaque lines.
*   **Corner Treatment:** All containers must use a strict **4px (0.25rem)** radius. It's enough to feel professional, but sharp enough to feel "rugged."

## 5. Components

### Primary Action Buttons
*   **Style:** Background `primary_container` (#e11d48) with `on_primary_container` (#fffaf9) text.
*   **Shape:** 4px radius.
*   **Detail:** Add a subtle top-inner-shadow (white at 10% opacity) to give the button a "milled metal" edge.
*   **Height:** Default 36px (h-9), Compact inputs use 44px (h-11).

### Data Tables (The Performance Ledger)
*   **Constraint:** Forbid divider lines.
*   **Design:** Use alternating row colors (Zebra striping) using `surface_container_lowest` and `surface_container_low`.
*   **Typography:** Column headers must use `label-sm` in all-caps with 10% letter spacing.

### Status Indicators (High-Performance States)
*   **Available:** `secondary` (#b9c8de) text on `secondary_container` (#39485a) background.
*   **Full:** `error` (#ffb4ab) text on `error_container` (#93000a) background.
*   **Reserved:** `tertiary` (#ffb690) text on `tertiary_container` (#bf5300) background.
*   **Shape:** Rectangular with 2px radius; these should look like "stamps" or "tags" found on industrial equipment.

### Input Fields
*   **Style:** No border. Use `surface_container_high` as the background.
*   **Active State:** A 2px bottom-bar of `primary_container` (#e11d48). This keeps the "Industrial" feel without boxing the user in.
*   **Height:** 44px (h-11) for inputs inside forms.

### Select / Dropdown Components
*   **Style:** No border. Use `bg-surface_container_high` as background.
*   **Height:** 44px (h-11) - same as inputs for consistency.
*   **Focus State:** 2px bottom-bar in `primary_container`.
*   **Trigger:** Chevron icon at 50% opacity.
*   **Dropdown Panel:** `bg-surface_container_low` with `ambient-shadow` for elevation.
*   **Items:** Py-2 px-2, hover state uses `bg-surface_container_high` with `text-primary`.

### Textareas
*   **Style:** No border. Background `surface_container_high`.
*   **Min Height:** 80-100px depending on content importance.
*   **Active State:** 2px bottom-bar in `primary_container`.
*   **Resize:** Disabled by default (`resize-none`).

### Form Labels
*   **Style:** `text-xs` size, `text-on_surface_variant` color.
*   **Typography:** Uppercase with `tracking-wider` for visual hierarchy.
*   **Spacing:** Use `space-y-1.5` (tighter than standard `space-y-2`).

### Dialogs / Modals

#### Overlay
*   **Background:** `bg-black/70` with `backdrop-blur-sm`.
*   **Animation:** Fade in/out using Tailwind's `animate-in`/`animate-out`.

#### Content Panel
*   **Background:** `bg-surface_container_low`.
*   **Shape:** `rounded-md` (4px radius).
*   **Width:** `max-w-md` (384px) for standard forms.
*   **Padding:** `p-6` for header/content, `pb-4` for content area, `p-6 pt-2` for footer.
*   **Border:** None - use background shift for definition.

#### Dialog Header
*   **Title:** `font-display`, `text-xl`, `font-bold`, `tracking-tight`, `uppercase`.
*   **Description:** `text-sm`, `text-on_surface_variant`, positioned below title.
*   **Layout:** Header separated from content with natural spacing (`space-y-2`).

#### Dialog Footer
*   **Layout:** Buttons side-by-side using `flex gap-3`.
*   **Button Sizing:** Both buttons use `flex-1 h-11` for equal width.
*   **Separation:** `gap-3` between buttons instead of dividers.

#### Close Button
*   **Position:** Absolute, `right-4 top-4`.
*   **Style:** `text-on_surface_variant` with opacity transition on hover.

#### Detail Dialog (Entity View)
Variante de modal de gran tamaño para mostrar el detalle completo de una entidad (clase programada, atleta, etc.). Se diferencia del Form Dialog en estructura, tamaño y propósito.

**Container:**
*   `max-w-4xl`, `max-h-[90vh]`, `flex flex-col` — columna con scroll interno.
*   `bg-surface_container_lowest`, `rounded-lg`, `shadow-2xl shadow-black/80`, `p-0`.

**Header (fijo, `shrink-0`):**
*   Fondo: `bg-surface_container_lowest`, padding `p-8`.
*   Acento visual: barra vertical izquierda de 4px en `bg-primary_container` (`absolute top-0 left-0 w-1 h-full`).
*   Eyebrow: `text-[10px] font-black tracking-[0.2em] text-primary_container uppercase font-display`. Ejemplo: `CLASS_INFO_VIEW`.
*   Título: `text-4xl font-display font-extrabold tracking-tighter text-white uppercase`.
*   Metadatos en línea: separados por divisores `h-8 w-px bg-neutral-800`. Cada meta usa label `text-[10px] text-neutral-500 font-bold tracking-widest uppercase` + valor `text-sm font-bold text-white`.
*   Avatar de persona: `w-10 h-10 rounded-full bg-primary_container/20 border border-primary_container/30`, iniciales en `text-xs font-black text-primary_container`.

**Área de contenido (scrollable, `flex-1 overflow-y-auto`):**
*   Padding `p-8`, espacio entre secciones `space-y-8`.
*   Encabezados de sección: icono `w-4 h-4 text-primary_container` + label `text-xs font-black tracking-widest text-neutral-400 uppercase font-display`.
*   Bloques de contenido: `bg-surface_container_low p-5 rounded-lg`.

**Tabla de asistentes:**
*   Header row: `bg-surface_container_lowest`, celdas con `text-[10px] font-bold text-neutral-500 tracking-widest uppercase`.
*   Body rows: `hover:bg-surface_container_low transition-colors`, separadas por `divide-y divide-neutral-900/50`.
*   ID: `text-xs font-mono text-neutral-400` con prefijo `#`.
*   Nombre: `text-sm font-bold text-white`.
*   Badges de membership/status: `text-[9px] font-black rounded-sm uppercase px-2 py-0.5`.

**Footer (fijo, `shrink-0`):**
*   Fondo: `bg-surface_container_lowest`, padding `p-6`.
*   Botón secundario (outline): `px-6 py-2.5 text-xs font-bold text-neutral-400 border border-neutral-800 rounded hover:text-white hover:border-neutral-600 uppercase tracking-widest font-display`.
*   Botón primario (filled): `px-8 py-2.5 text-xs font-bold bg-primary_container text-on_primary_container rounded hover:brightness-110 uppercase tracking-widest font-display shadow-lg shadow-primary_container/20`.
*   Ambos botones con `active:scale-95` para feedback táctil.

## 6. Layout Patterns

### Form Layout
*   **Vertical rhythm:** `space-y-4` between major sections.
*   **Label-input pairing:** Labels use `space-y-1.5` above inputs.
*   **Grid layouts:** Use `grid-cols-2 gap-3` for two-column form fields.
*   **Full-width buttons:** In dialogs, use `flex-1` for equal-width action buttons.

### Card Layouts
*   **Content padding:** `p-5` standard, `p-0` for lists (content handles its own padding).
*   **Header separation:** Use `pb-4` or `border-b` only when absolutely necessary.
*   **Lists inside cards:** Items use `mx-5 mb-1` for horizontal padding, `bg-surface_container_low` background.

## 7. Do's and Don'ts

### Do:
*   **Embrace Negative Space:** Use wide margins (`spacing-xl`) between major sections to let the high-contrast elements breathe.
*   **Use Intentional Overlaps:** Let a display headline partially sit behind a glass-morphic card to create architectural depth.
*   **Focus on Data Density:** In tables, use `label-sm` for secondary info to keep the "performance ledger" feel.
*   **Use equal-width buttons** in dialogs for primary/secondary actions.
*   **Use uppercase labels** with tracking for form sections.

### Don't:
*   **Don't use Rounded Pills:** Unless it's a specific selection chip, avoid `full` (999px) rounding. It softens the brand too much.
*   **Don't use Grey Shadows:** Never use `#000000` for shadows. Use a darkened version of your surface color to keep the "dark-mode" looking premium and not "muddy."
*   **Don't use Dividers:** If you feel the need to separate two pieces of content, increase the `gap` or shift the background color tier instead.
*   **Don't use bordered inputs** - use background color shifts or bottom-bar focus states.
*   **Don't use varying button heights** - maintain 44px (h-11) for form buttons and 36px (h-9) for inline actions.