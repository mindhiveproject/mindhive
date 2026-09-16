# Capturing a surface into Figma

Putting the shipped state of a surface on the canvas, so a `DESIGN_DRIFT`
decision gets made against what actually renders instead of against memory.

Verified 10 Sep 2026 on `front.home`.

## Code to Canvas is not available here — read this first

Figma's `generate_figma_design` — the tool that drives a browser and imports a
page as **editable layers** — is **not exposed by the claude.ai Figma
connector**. The `use_figma` tool description references it, and Figma's own
docs describe it, but it is not in this server's tool list. Plan around its
absence rather than around the marketing.

What that costs: captures are **flat images**, not editable layers. What it does
not cost: the actual purpose. A drift review needs truthful evidence of current
state, and a screenshot is that. Editability was always the nice-to-have.

If the tool appears later, or you connect the desktop MCP server instead, revisit
this — the editable version is strictly better for design work.

## The workflow

1. **Screenshot the surface** with headless Chrome against the running app:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --hide-scrollbars \
     --virtual-time-budget=9000 --window-size=1440,1600 \
     --screenshot="front.home — captured 10 Sep 2026.png" \
     "http://localhost:3000/discover"
   ```

   Name the file for the surface and date — with a multipart upload the filename
   becomes the Figma layer name.

2. **`upload_assets`** with `count: 1` and `scaleMode: "FIT"`, then POST the
   bytes to the returned `submitUrl` as `multipart/form-data` with a `file`
   field. Raw bytes work too but lose the layer name. The response gives
   `placedOnNodeId` — the frame it created.

3. **`use_figma`** to wrap that node in a labelled card carrying the surface key,
   the route, the capture date and **the commit sha**. Without the sha a capture
   is a picture; with it, it is evidence tied to a known state of the code.

4. **Write the frame's node id** back to `figmaNodeId` on that surface in
   `lib/surfaces.js`, and onto the ticket. `npm run lint:surfaces` reports the
   coverage — `0/47 have a Figma frame on record` until captures start landing.

## Gotchas

- **Auth.** Headless Chrome has no session, so `/dashboard/*` renders as logged
  out. Public surfaces capture directly; anything behind a login needs a session
  cookie passed to Chrome, or a capture taken by hand.
- **`resize()` resets sizing modes.** Call it first, set `layoutSizingHorizontal`
  / `layoutSizingVertical` after — the reverse silently loses the mode.
- **An auto-layout card that hugs will squeeze the image** to the width of its
  text. Fix the card's width to the capture's natural width plus padding, and let
  the image FILL.
- **`await node.screenshot()` inside `use_figma` does not spend the read
  budget**, unlike a separate `get_screenshot` call. On the free tier that is 20
  reads a month, so prefer the inline one for verification.

## Do not bulk-capture

One surface at a time, driven by a ticket. Capturing all 47 produces a large file
of unstructured frames with no variables and no component links — a second
artifact to maintain, which is the problem this whole branch exists to remove.
Captures are allowed to go stale, because the code they came from is what is
true.
