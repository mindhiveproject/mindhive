/**
 * Keep app-global overlays from counting as "outside clicks" to page modals.
 *
 * Six components in this app close on any mousedown or click that lands outside
 * their box — `document.addEventListener("mousedown", …)` plus a `contains()`
 * check. The Help Center and the ticket panel sit outside every one of those
 * boxes, so opening help or filing a ticket over a modal closed the modal: the
 * exact moment you wanted to report something *about* it.
 *
 * Fixing each modal would not scale and would miss the next one. Instead, the
 * overlays stop these events from propagating past React's root container.
 * React 17+ attaches its listeners to the root, not to `document`, so stopping
 * propagation there keeps the native event from ever reaching the modal's
 * document-level listener — while React's own handlers inside the overlay run
 * normally.
 *
 * Limit, stated plainly: this only works against BUBBLE-phase listeners. A modal
 * that listens with `{ capture: true }` sees the event before it reaches the
 * overlay at all. None in this codebase do today; if one appears, it needs the
 * same treatment on its side.
 *
 * Spread onto the outermost element of the overlay:
 *
 *   <div {...isolateFromPage}>…</div>
 */

const stop = (event) => event.stopPropagation();

export const isolateFromPage = {
  onMouseDown: stop,
  onPointerDown: stop,
  onTouchStart: stop,
  onClick: stop,
};
