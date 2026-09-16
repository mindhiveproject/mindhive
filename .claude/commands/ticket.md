---
description: Load a platform ticket and its surface context, then work the fix
argument-hint: <ticket-id>
allowed-tools: Bash(node scripts/ticket-context.mjs:*), Read, Grep, Glob, Edit, Write
---

Work platform ticket `$1`.

## 1. Load the ticket

```
!node scripts/ticket-context.mjs $1
```

That prints the ticket, the surface it was filed against, and the files under
that surface's root. If it fails, stop and report why rather than guessing at
which ticket was meant.

## 2. Read before changing

The surface `root` is the answer to "where in the code?" — start there rather
than searching the whole tree. Read the files the script lists. If the fix
clearly belongs outside that root, say so explicitly before moving.

The `evidence` block is often the whole explanation: viewport, locale, and the
reporter's roles at filing time are what make a bug reproducible for one person
and invisible to everyone else. A locale in `evidence` that is not `en-us` means
check `locales/` before assuming the string is hardcoded.

If `hasScreenshot` is true there is a capture, but it is deliberately not
returned — it can contain student names and responses. Open the ticket in the
app to look at it: `/dashboard/tickets/$1`.

## 3. Fix it, at the right altitude

Match the surrounding code. Two house rules that this repo enforces
mechanically, so breaking them fails the build:

- **Colours come from tokens.** `var(--MH-Theme-Neutrals-Dark, #6a6a6a)` — the
  fallback must match `components/DesignSystem/Theme.css`. `npm run lint:tokens`
  checks this.
- **Surfaces stay in the registry.** If the fix adds or removes a route, update
  `lib/surfaces.js`. `npm run lint:surfaces` checks this.

By ticket kind:

- **COPY** — the string probably lives in `locales/en-us/*.json`, not in the
  component. Change every locale you can do responsibly; leave the rest and say
  which.
- **DESIGN_DRIFT** — usually a raw hex where a token belongs, or a value that
  disagrees with `Theme.css`. Mechanical, and the token guard verifies it.
- **BUG** — reproduce from the evidence first. If you cannot reproduce it, say
  so and stop; a confidently wrong fix to a bug nobody can trigger is worse than
  an open ticket.
- **MISSING / IDEA** — these are product decisions wearing a ticket's clothes.
  Summarise what building it would involve and hand it back; do not build it.

## 4. Verify

From `frontend/`: `npm run lint:tokens && npm run lint:surfaces`, and
`npm run build` if the change is more than a string. There is no test suite in
this repo — say plainly what you could and could not verify rather than implying
coverage that does not exist.

## 5. Commit

Include the trailer so the ticket closes itself on merge:

```
<subject line>

<why, if it is not obvious>

Fixes-Ticket: $1
```

Do **not** write that trailer unless the fix is real and complete. A board that
closes tickets which were not fixed stops being trustworthy, which is the exact
failure this whole system exists to prevent.
