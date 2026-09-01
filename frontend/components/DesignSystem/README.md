# Design System

The shared UI primitives. Build screens from these — don't add per-component
`Styled*.js` blobs, and prefer extending a primitive here over re-implementing
one locally.

## Where the design comes from

These components are drawn mostly from the **Figma Design System file**:
<https://www.figma.com/design/AODZL5Cne8QAt0Yy9ZcKkM/Design-System?node-id=1878-410>
Component files carry the Figma node ids they were built from (e.g. `Card.tsx`
references node `1143:2619`) — check Figma first for exact tokens, sizes, states,
and naming before adding or changing a component.

The system takes **Material 3 as its inspiration** — surface variants (elevated /
filled / outline), quiet elevation-led interaction states, chip and button
anatomy, the 4px spacing grid. When Figma is silent on a detail, Material 3 is
the tie-breaker; when the two disagree, Figma wins.

## File conventions

Every component in this folder should be:

- **A single `.tsx` file** named after the component, with a **default export** of
  the same name (`Card.tsx` → `export default function Card`).
- **`"use client";`** as the first line (these are all client components).
- Fronted by an **exported `Props` interface** — `CardProps`, `ChipProps`, … — with
  a **TSDoc `/** … *\/` comment on every field**. This interface _is_ the
  component's documentation; keep it complete enough that someone can use the
  component from the type alone.
- Styled with **styled-components** (`@types/styled-components` is installed),
  not raw inline style objects or a hand-rolled `<style dangerouslySetInnerHTML>`
  block: fixed design-system CSS (borders, radii, transitions, hover/pressed/
  selected/disabled states, focus-visible) lives in a module-level
  `const StyledFoo = styled.div\`…\`` and is toggled with modifier classes
  (`DesignSystem-Foo--selected`, `--disabled`, …) via `clsx`, generally in the
  same **priority order** the modifiers should win in when more than one could
  apply at once (later in the template wins ties — see `Card.tsx`'s pressed
  vs. hover ordering). Genuinely **per-instance** values that come from a
  caller, not a fixed token — `padding`, a numeric `labelLines` clamp — stay on
  the `style` prop, layered on top. Pull colors from `--MH-Theme-*` CSS
  variables with a hex fallback: `"var(--MH-Theme-Primary-Light, #def8fb)"`.
- Scoped class names of the form `DesignSystem-<Name>` on the root, with
  `DesignSystem-<Name>--<modifier>` for variants/states. If another file reaches
  into a component's classes from outside (grep for the class name first),
  remember `styled(Foo)` wrappers reliably win equal-specificity ties against
  the wrapped component's own rules — that's the mechanism, lean on it rather
  than fighting it.
- Prefer real CSS pseudo-classes (`:hover`, `:focus-visible`) over JS-tracked
  state. Only fall back to a JS-driven modifier class when CSS genuinely can't
  express the rule — e.g. `Card`'s pressed state can't be plain `:active`
  because that also fires when a nested interactive island (a button rendered
  inside the card) is clicked, so it's excluded in `onMouseDown` instead.

## Documenting props

- One `/** … */` per interface field. Note defaults with `@default`.
- Put usage examples as `@example` blocks on the interface (see `ChipProps`).
- Use string-literal unions for enumerable options and export them
  (`export type ChipVariant = "interactive" | "static";`) so callers and other
  DS components can reference them.
- Extend `React.ComponentPropsWithoutRef<"button">` (or `"a"`, `"div"`, …) when the
  component forwards `...rest` to a real element, then `Omit` the props you
  override.

## Interaction states

House rules (enforced in review):

- **No opacity-fade hovers.** A surface gets either a fill change or an outline
  change — never a dimmed clone of itself.
- **A surface has a fill _or_ an outline, not both.**
- Hover means "more ink, same hue": deepen the existing fill rather than switching
  to a different colour family. Pressed is one gentle step further.
- Only show a hover state on something the user can actually act on.

## Migration status

Components are being moved from `.js` to `.tsx` as they're touched, newest first.

| Component | Status |
|---|---|
| `Card` | ✅ `.tsx` |
| `Chip` | ✅ `.tsx` |
| `FavoriteButton` | ✅ `.tsx` |
| `Navbar` | ✅ `.tsx` |
| `lib/taskTypeColors` | ✅ `.ts` |
| `Button`, `IconButton`, `Modal`, `Popover`, `Tooltip`, `DropdownMenu`, `DropdownSelect`, `MessageCard`, `InfoPopover`, `PanelHeader`, `CopyButton`, `CompactActionButton`, `Icons/` | ⏳ still `.js` |

When converting a `.js` component that another `.tsx` file already imports, watch
for TS mis-inferring its JSDoc-typed props — see the `RawTooltip` cast in
`Chip.tsx` for the interim workaround, which should be deleted once `Tooltip` is
itself `.tsx`.
