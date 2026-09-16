/**
 * How the Help Center asks the ticket overlay to open.
 *
 * The two are siblings in `_app.js` with no parent between them, so the choices
 * were a context provider threaded through the app shell or a window event.
 * The event wins here because the overlay is *already* an app-global control
 * listening to a global signal — the Alt+Shift+T chord — so this is the same
 * mechanism it uses, not a second one.
 *
 * The event name lives here rather than as a string literal in two files, which
 * is the only way this kind of coupling stays greppable.
 */

export const OPEN_TICKET_PANEL = "mh:open-ticket-panel";

/** Ask the overlay to open. Safe to call before it has mounted — nothing listens, nothing breaks. */
export function openTicketPanel() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_TICKET_PANEL));
}

/** Subscribe. Returns the unsubscribe function, shaped for a useEffect cleanup. */
export function onOpenTicketPanel(handler) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_TICKET_PANEL, handler);
  return () => window.removeEventListener(OPEN_TICKET_PANEL, handler);
}

/*
 * How many tickets are open on the current page — broadcast by the overlay,
 * shown by the Help Center.
 *
 * The overlay already queries this for its "already open here" list, so the
 * Help Center is told the number rather than running a second query of its own.
 * It never learns anything else about tickets, which keeps the coupling to one
 * integer.
 *
 * The last value is kept, and replayed to anyone who subscribes late: the two
 * are siblings that mount in the same pass, so either could subscribe or
 * announce first.
 */

export const OPEN_TICKET_COUNT = "mh:open-ticket-count";

let lastCount = 0;

export function announceOpenTicketCount(count) {
  if (typeof window === "undefined") return;
  lastCount = count;
  window.dispatchEvent(new CustomEvent(OPEN_TICKET_COUNT, { detail: count }));
}

export function onOpenTicketCount(handler) {
  if (typeof window === "undefined") return () => {};
  handler(lastCount);
  const listener = (event) => handler(event.detail);
  window.addEventListener(OPEN_TICKET_COUNT, listener);
  return () => window.removeEventListener(OPEN_TICKET_COUNT, listener);
}
