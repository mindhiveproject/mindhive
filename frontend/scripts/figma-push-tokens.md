# Pushing design tokens into Figma

How `design-tokens.json` becomes Figma variables and styles. Verified end to end
on 10 Sep 2026 against a scratch file; the only thing that changes for the real
Design System file is the `fileKey`.

This is not a script you can run — the write goes through the Figma MCP server's
`use_figma` tool, which executes JavaScript inside the file via the Plugin API.
It is recorded here so the next run is a paste rather than a rediscovery.

## Before you start

1. `npm run tokens:build` — regenerate `design-tokens.json` from the CSS
2. Load the `figma-use` skill (`skill://figma/figma-use/SKILL.md`). The server
   marks it mandatory before `use_figma`, and it is not ceremony: most of the
   gotchas below come straight from it
3. Confirm the target: `whoami` for the plan key, and check you have **edit**
   access to the file. View access connects fine and then fails on first write

## Why not the REST API

`POST /v1/files/:key/variables` is **Enterprise-only**. MindHive is on Starter
(Education pending), so the REST route is closed. The Plugin API has no such
restriction, which is what `use_figma` drives. Tokens Studio is the equivalent
manual route if the MCP is unavailable.

## The three mappings

| Token type in the JSON | What it becomes in Figma | Why |
|---|---|---|
| `color` (39) | COLOR variables in a `MindHive Theme` collection | Variables are the only thing Figma can bind to a fill and resolve per mode |
| `shadow` (4) | Effect styles | Shadows cannot be variables — the Plugin API has no shadow variable type |
| `typography` (12) | Text styles | Same reason; `fontSize`/`lineHeight` are not bindable via `setBoundVariable` |

## Gotchas that cost time

- **COLOR variable values take `{r, g, b, a}`; paints take `{r, g, b}`.** Mixing
  them up throws. All channels are 0–1, not 0–255.
- **Inter's weights are `"Regular"`, `"Medium"`, `"Semi Bold"`** — with a space.
  `"SemiBold"` fails.
- **Load every font weight before writing any text style**, in one
  `Promise.all`. The canonical load-then-mutate recipe applies to styles, not
  just text nodes.
- **Set `scopes` explicitly.** The default `ALL_SCOPES` puts every colour in
  every picker, including font size. These use `["ALL_FILLS", "STROKE_COLOR"]`.
- **Free plan allows one mode per collection.** Fine here — there is one theme.
  Revisit if a dark mode is ever added; Professional allows four.
- Both scripts are **idempotent**: they reuse a collection or style of the same
  name rather than creating duplicates, so a re-run updates in place.

## The link back to code

Each variable carries its source CSS custom property as WEB code syntax:

```js
variable.setVariableCodeSyntax("WEB", `var(--MH-Theme-Primary-Dark)`);
```

Taken verbatim from `$extensions["science.mindhive.cssVariable"]` rather than
derived from the Figma name. Derivation looks fine until a name contains a space
or a slash, and then the two can no longer be matched. Effect and text styles
carry the same link in their `description`, which is the only free-text field
those types have.

## Running it

Two `use_figma` calls, both with `skillNames: "resource:figma-use"`:

1. **Colours** — build a `[name, hex, cssVar]` array from `design-tokens.json`,
   create or reuse the `MindHive Theme` collection, then for each token create
   or update the variable, `setValueForMode`, set `scopes`, set code syntax.
2. **Shadows and type** — parse each `box-shadow` string into a `DROP_SHADOW`
   effect, and each typography token into `fontName` / `fontSize` /
   `lineHeight` / `letterSpacing`.

Generate the arrays rather than typing them:

```bash
cd frontend
node -e '
const t=require("./design-tokens.json");
const rows=[];
for (const [g,steps] of Object.entries(t.color))
  for (const [s,tok] of Object.entries(steps))
    rows.push([`${g}/${s}`, tok.$value, tok.$extensions["science.mindhive.cssVariable"]]);
console.log(JSON.stringify(rows));
'
```

## After the real run

Record what the Design System file already had before overwriting anything —
this pipeline assumes it is the source of truth for colour, and if someone has
hand-made variables there, that assumption needs a conversation first, not a
merge.
