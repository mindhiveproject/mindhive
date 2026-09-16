import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import styled from "styled-components";

import { UserContext } from "./Authorized";
import Button from "../DesignSystem/Button";
import { surfaceForRoute } from "../../lib/surfaces";
import { parseFigmaUrl, describeFigmaUrl } from "../../lib/figmaUrl";
import { parseNotionPageUrl } from "../../lib/notionUrl";
import { onOpenTicketPanel, announceOpenTicketCount } from "../../lib/ticketPanel";
import { isolateFromPage } from "../../lib/isolateFromPage";
import FigmaLink from "../Dashboard/Tickets/FigmaLink";
import ScreenshotAnnotator from "../Dashboard/Tickets/ScreenshotAnnotator";
import {
  useSupportTicketPreviews,
  supportTicketHint,
} from "../Dashboard/Tickets/SupportTickets";
import {
  CREATE_TICKET,
  CREATE_TICKET_WITH_SCREENSHOT,
  SET_TICKET_STATUS,
} from "../Mutations/Ticket";
import { GET_TICKETS_FOR_SURFACE } from "../Queries/Ticket";

/**
 * File a ticket against the page you are looking at.
 *
 * Mounted once in `_app.js` beside `<HelpCenter />`, so it is available on
 * every route without any page knowing about it. Only rendered for viewers
 * holding `canManageTickets` — and the server enforces the same flag on the
 * Ticket list, so hiding the UI is a convenience, not the access control.
 *
 * The anchor is the surface key resolved from `router.pathname`, not the URL:
 * `/dashboard/boards/cmf3x9…` names one user's board, while
 * `dashboard.boards` names the thing that is broken. See lib/surfaces.js.
 */

const TOGGLE_HINT = "Alt+Shift+T";

/** Long edge cap for uploaded captures. A full-page PNG of an AG Grid is
 *  several megabytes; this keeps a legible screenshot near ~200KB. */
const MAX_CAPTURE_EDGE = 1600;
const CAPTURE_QUALITY = 0.7;

const KINDS = [
  { value: "BUG", label: "Bug" },
  { value: "DESIGN_DRIFT", label: "Design drift" },
  { value: "MISSING", label: "Missing" },
  { value: "COPY", label: "Copy" },
  { value: "IDEA", label: "Idea" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
];

const OPEN_STATUSES = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

/**
 * An empty form — the starting state AND the reset after filing. Defined once
 * because the two drifted: figmaDesignUrl was added to the start but not to the
 * reset, so after filing it became undefined and "File another" crashed on
 * `.trim()`. One constant cannot drift from itself.
 */
const EMPTY_FORM = {
  title: "",
  kind: "BUG",
  priority: "NORMAL",
  description: "",
  figmaDesignUrl: "",
  supportTicketUrl: "",
  withScreenshot: true,
};

// Capitalised, and rendered as a chip: a bare lowercase "open" beside a link
// read as the verb — as if it opened the ticket.
const STATUS_LABELS = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  WONTFIX: "Won't fix",
};

/**
 * Surfaces that must never be captured. A screenshot of a participant session,
 * a live class or a student's ballot can contain names and responses, so the
 * overlay refuses rather than capturing and trusting someone to delete it
 * later. Tickets can still be filed here — just without an image.
 */
const NO_CAPTURE_PREFIXES = ["participate."];

function captureForbidden(surfaceKey) {
  return NO_CAPTURE_PREFIXES.some((prefix) => surfaceKey?.startsWith(prefix));
}

/** Downscale and re-encode, so the upload is a screenshot rather than a file. */
async function toUploadableFile(canvas, surfaceKey) {
  const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(canvas.width, canvas.height));
  let source = canvas;

  if (scale < 1) {
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const ctx = scaled.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    source = scaled;
  }

  const blob = await new Promise((resolve) =>
    source.toBlob(resolve, "image/jpeg", CAPTURE_QUALITY)
  );
  if (!blob) return null;
  return new File([blob], `${surfaceKey}-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export default function TicketOverlay() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filed, setFiled] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // The screenshot, once previewed: `base` is the raw capture, `file` what gets
  // uploaded (the markup, if any), `shapes` what lets "Edit markup" reopen it
  // editable rather than drawing over an already-flattened image.
  const [shot, setShot] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(null);

  const canManageTickets = useMemo(
    () => !!user?.permissions?.some((permission) => permission?.canManageTickets),
    [user]
  );

  const surface = surfaceForRoute(router.pathname, router.query);
  const surfaceKey = surface?.key ?? null;
  const noCapture = captureForbidden(surfaceKey);

  const figmaParsed = parseFigmaUrl(form.figmaDesignUrl);
  const figmaSummary = describeFigmaUrl(form.figmaDesignUrl);
  const figmaHasNode = !!figmaParsed?.nodeId;
  const figmaInvalid = form.figmaDesignUrl.trim() !== "" && !figmaSummary;

  // One support ticket at filing; more can be linked on the ticket page.
  const supportUrl = form.supportTicketUrl.trim();
  const supportInvalid = supportUrl !== "" && !parseNotionPageUrl(supportUrl);
  const { byUrl: supportPreviews, loading: supportChecking } = useSupportTicketPreviews(
    supportUrl ? [supportUrl] : []
  );
  const supportHint = supportTicketHint(supportUrl, supportPreviews.get(supportUrl), supportChecking);

  const { data, refetch } = useQuery(GET_TICKETS_FOR_SURFACE, {
    variables: { surface: surfaceKey },
    skip: !canManageTickets || !surfaceKey,
    fetchPolicy: "cache-and-network",
  });

  const tickets = data?.tickets ?? [];
  const openTickets = tickets.filter((ticket) => OPEN_STATUSES.includes(ticket.status));

  // Two documents, because Keystone's image `upload` input is non-null and
  // GraphQL cannot omit an input field conditionally. See Mutations/Ticket.js.
  const [createTicket] = useMutation(CREATE_TICKET);
  const [createTicketWithScreenshot] = useMutation(CREATE_TICKET_WITH_SCREENSHOT);
  const [setTicketStatus] = useMutation(SET_TICKET_STATUS);

  // Alt+Shift+T. Alt-based to stay clear of the browser's own chords —
  // Ctrl+Shift+T reopens a closed tab, Cmd+Shift+K is the Firefox console.
  const onKeyDown = useCallback(
    (event) => {
      if (!canManageTickets) return;
      if (event.altKey && event.shiftKey && event.code === "KeyT") {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
      if (event.key === "Escape") setOpen(false);
    },
    [canManageTickets]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // The Help Center menu is now the visible way in; the chord above is the
  // shortcut. Both land here.
  useEffect(() => onOpenTicketPanel(() => setOpen(true)), []);

  // A ticket belongs to the page it was filed from, so close on navigation
  // rather than carrying a half-written one to a different surface.
  useEffect(() => {
    const close = () => {
      setOpen(false);
      setFiled(null);
      setShot(null);
      setAnnotating(false);
    };
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  // Tell the Help Center how many are open here, so its launcher can show it
  // before anyone opens the panel. Zero when the viewer cannot see tickets.
  useEffect(() => {
    announceOpenTicketCount(canManageTickets ? openTickets.length : 0);
  }, [canManageTickets, openTickets.length]);

  // A thumbnail of whatever will be attached, revoked when it changes.
  useEffect(() => {
    if (!shot?.file) {
      setThumbUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(shot.file);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [shot]);

  if (!canManageTickets) return null;

  const evidence = () => ({
    url: window.location.href,
    route: router.pathname,
    area: router.query?.area ?? null,
    selector: router.query?.selector ?? null,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    locale: router.locale ?? null,
    roles: user?.permissions?.map((permission) => permission?.name).filter(Boolean) ?? [],
    userAgent: navigator.userAgent,
  });

  async function capture() {
    if (noCapture || !form.withScreenshot) return null;
    try {
      // Loaded on demand: html2canvas is large and most page loads never file
      // a ticket.
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.body, {
        logging: false,
        useCORS: true,
        // The panel itself is not part of the bug.
        ignoreElements: (element) => element.dataset?.mhTicketUi === "true",
      });
      return await toUploadableFile(canvas, surfaceKey);
    } catch (captureError) {
      // A refused or failed capture must never block filing — the written
      // report is the part that matters.
      console.warn("Ticket screenshot capture failed:", captureError);
      return null;
    }
  }

  /**
   * Capture now (if not already) and open the editor. Capturing early is what
   * makes markup possible — and it also shows the reporter exactly what will be
   * attached before it is sent, which matters when a page can show student data.
   */
  async function previewAndMarkUp() {
    if (noCapture) return;
    let current = shot;
    if (!current) {
      setCapturing(true);
      setError(null);
      const file = await capture();
      setCapturing(false);
      if (!file) {
        setError("The screenshot could not be captured. You can still file without one.");
        return;
      }
      current = { base: file, file, shapes: [] };
      setShot(current);
    }
    setAnnotating(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !surfaceKey) return;
    // Caught here rather than left to the server: by the time the server
    // rejects a link, the screenshot has already been uploaded, and a rejected
    // upload stays on disk until the weekly prune sweeps it.
    if (figmaInvalid) {
      setError("That Figma link is not a figma.com link. Fix it or clear it to file the ticket.");
      document.getElementById("mh-ticket-figma")?.focus();
      return;
    }
    if (supportInvalid) {
      setError("That support ticket link is not a Notion link. Fix it or clear it to file the ticket.");
      document.getElementById("mh-ticket-support")?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // The previewed capture — marked up or not — if there is one; otherwise
      // capture now, as before. Unticking the box discards either.
      const screenshot = form.withScreenshot && shot ? shot.file : await capture();
      const variables = {
        surface: surfaceKey,
        title: form.title.trim(),
        kind: form.kind,
        priority: form.priority,
        body: form.description ? { text: form.description } : null,
        evidence: evidence(),
        reporterId: user.id,
        // Empty string, not null: this is a non-nullable text column, where
        // "" is how "not provided" is stored. The backend's figma.com check
        // already skips empty values. (An earlier version sent null here on
        // the mistaken belief that "" would fail that check — it failed
        // every ticket filed without a link instead.)
        figmaDesignUrl: form.figmaDesignUrl.trim(),
        supportTickets: supportUrl ? [supportUrl] : [],
      };
      const result = screenshot
        ? await createTicketWithScreenshot({
            variables: { ...variables, screenshot },
          })
        : await createTicket({ variables });
      setFiled({
        id: result?.data?.createTicket?.id,
        withScreenshot: !!screenshot,
      });
      setForm(EMPTY_FORM);
      setShot(null);
      await refetch();
    } catch (submitError) {
      setError(submitError.message || "Could not file the ticket.");
    }
    setSaving(false);
  }

  async function markShipped(id) {
    await setTicketStatus({ variables: { id, status: "SHIPPED" } });
    await refetch();
  }

  const set = (key) => (event) =>
    setForm((current) => ({
      ...current,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  return (
    <>

      {open && (
        <Panel
          {...isolateFromPage}
          data-mh-ticket-ui="true"
          role="dialog"
          aria-label="File a ticket"
          onKeyDown={(event) => {
            // Page modals close on Escape via a window listener. Stopping it
            // here closes only this panel, so the modal you were reporting
            // on stays open underneath.
            if (event.key === "Escape") {
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <PanelHead>
            <div>
              <Eyebrow>Filing against</Eyebrow>
              <SurfaceName>{surface?.label ?? "Unregistered surface"}</SurfaceName>
              <SurfaceKey>{surfaceKey ?? router.pathname}</SurfaceKey>
            </div>
            <Chord aria-hidden="true">{TOGGLE_HINT}</Chord>
            <CloseButton type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </CloseButton>
          </PanelHead>

          {!surfaceKey && (
            <Notice tone="warn">
              This route has no surface in <code>lib/surfaces.js</code>, so a ticket
              filed here would have nothing stable to point at. Add it to the
              registry first — <code>npm run lint:surfaces</code> will confirm.
            </Notice>
          )}

          {openTickets.length > 0 && (
            <Existing role="status">
              <ExistingHead>
                <ExistingCount aria-hidden="true">{openTickets.length}</ExistingCount>
                <div>
                  <ExistingTitle>
                    {openTickets.length === 1
                      ? "1 ticket is already open on this page"
                      : `${openTickets.length} tickets are already open on this page`}
                  </ExistingTitle>
                  <ExistingHint>
                    Check these first — yours may already be filed, or someone may be on it.
                  </ExistingHint>
                </div>
              </ExistingHead>
              {openTickets.map((ticket) => (
                <ExistingRow key={ticket.id}>
                  {/* Three kinds of thing live in this row, and each now looks
                      like what it is: the ticket's STATE (a chip), a way to
                      READ it (a bordered button), and an ACTION on it (a
                      verb). Before, all three were bare lowercase words. */}
                  <RowTitle>{ticket.title}</RowTitle>

                  {/* New tab, deliberately: you are part-way through filing on
                      this page, and navigating away would lose the form. */}
                  <ViewButton
                    href={`/dashboard/tickets/${ticket.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View "${ticket.title}" — opens in a new tab`}
                  >
                    View details <span aria-hidden="true">↗</span>
                  </ViewButton>

                  <ExistingMeta>
                    <StatusChip data-status={ticket.status}>
                      <VisuallyHidden>Status: </VisuallyHidden>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </StatusChip>
                    <Tag data-claimed={ticket.assignee ? "yes" : "no"}>
                      {ticket.assignee ? `${ticket.assignee.username} is on it` : "Unclaimed"}
                    </Tag>
                    <FigmaLink url={ticket.figmaDesignUrl} />
                  </ExistingMeta>

                  <MarkShipped
                    type="button"
                    onClick={() => markShipped(ticket.id)}
                    title="Mark this ticket as shipped — it will close here and in Notion"
                  >
                    Mark as shipped
                  </MarkShipped>
                </ExistingRow>
              ))}
            </Existing>
          )}

          {filed ? (
            <Notice tone="ok">
              Filed{filed.withScreenshot ? " with a screenshot" : " without a screenshot"}.{" "}
              <LinkButton type="button" onClick={() => setFiled(null)}>
                File another
              </LinkButton>
            </Notice>
          ) : (
            <form onSubmit={submit}>
              <Field>
                <label htmlFor="mh-ticket-title">What is wrong?</label>
                <input
                  id="mh-ticket-title"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="One line — the card title"
                  autoFocus
                  required
                />
              </Field>

              <Row>
                <Field>
                  <label htmlFor="mh-ticket-kind">Kind</label>
                  <select id="mh-ticket-kind" value={form.kind} onChange={set("kind")}>
                    {KINDS.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <label htmlFor="mh-ticket-priority">Priority</label>
                  <select
                    id="mh-ticket-priority"
                    value={form.priority}
                    onChange={set("priority")}
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </Row>

              <Field>
                <label htmlFor="mh-ticket-description">
                  What should it do instead? <Optional>optional</Optional>
                </label>
                <textarea
                  id="mh-ticket-description"
                  rows={4}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Steps, the expected behaviour, the design it should match"
                />
              </Field>

              <Field>
                <label htmlFor="mh-ticket-figma">
                  Where is the intended design? <Optional>optional</Optional>
                </label>
                <input
                  id="mh-ticket-figma"
                  type="url"
                  value={form.figmaDesignUrl}
                  onChange={set("figmaDesignUrl")}
                  placeholder="Paste a Figma link"
                  aria-describedby="mh-ticket-figma-hint"
                  aria-invalid={figmaInvalid || undefined}
                />
                {/* Parsed live so a wrong paste — a prototype link, a URL with
                    no node-id, a page that is not Figma — is visible here
                    rather than months later when someone clicks it. */}
                {form.figmaDesignUrl.trim() !== "" &&
                  (figmaSummary ? (
                    <Hint id="mh-ticket-figma-hint">Links to {figmaSummary}</Hint>
                  ) : (
                    <Hint id="mh-ticket-figma-hint" tone="warn">
                      That does not look like a figma.com link.
                    </Hint>
                  ))}
                {form.figmaDesignUrl.trim() !== "" && figmaSummary && !figmaHasNode && (
                  <Hint id="mh-ticket-figma-hint" tone="warn">
                    No frame selected — the link opens the whole file. Select the
                    frame in Figma and copy the link again to point at it.
                  </Hint>
                )}
              </Field>

              <Field>
                <label htmlFor="mh-ticket-support">
                  Related support ticket <Optional>optional</Optional>
                </label>
                <input
                  id="mh-ticket-support"
                  type="url"
                  value={form.supportTicketUrl}
                  onChange={set("supportTicketUrl")}
                  placeholder="Paste the support ticket's Notion link"
                  aria-describedby="mh-ticket-support-hint"
                  aria-invalid={supportInvalid || undefined}
                />
                {/* Checked with Notion as it is pasted, so a link that will not
                    link shows up here rather than silently in the mirror. */}
                {supportHint && (
                  <Hint id="mh-ticket-support-hint" tone={supportHint.tone}>
                    {supportHint.text}
                  </Hint>
                )}
              </Field>

              {noCapture ? (
                <Notice tone="warn">
                  Screenshots are disabled on participant-facing surfaces — a capture
                  here could contain a participant&apos;s own responses. Describe what
                  you saw instead.
                </Notice>
              ) : (
                <>
                  <Checkbox>
                    <input
                      id="mh-ticket-screenshot"
                      type="checkbox"
                      checked={form.withScreenshot}
                      onChange={set("withScreenshot")}
                    />
                    <label htmlFor="mh-ticket-screenshot">
                      Attach a screenshot of this page
                    </label>
                  </Checkbox>
                  {form.withScreenshot && (
                    <ShotRow>
                      {thumbUrl && (
                        <Thumb>
                          <img src={thumbUrl} alt="The screenshot that will be attached" />
                          {shot?.shapes?.length > 0 && <ThumbBadge>Marked up</ThumbBadge>}
                        </Thumb>
                      )}
                      <ShotActions>
                        <ShotButton type="button" onClick={previewAndMarkUp} disabled={capturing}>
                          {capturing
                            ? "Capturing…"
                            : shot?.shapes?.length
                              ? "Edit markup"
                              : "Preview & mark up"}
                        </ShotButton>
                        {shot && (
                          <LinkButton type="button" onClick={() => setShot(null)}>
                            Retake
                          </LinkButton>
                        )}
                        {!shot && (
                          <ShotHint>Optional — circle what is wrong, add arrows and notes.</ShotHint>
                        )}
                      </ShotActions>
                    </ShotRow>
                  )}
                </>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <Actions>
                <Button
                  variant="filled"
                  type="submit"
                  disabled={saving || !form.title.trim() || !surfaceKey}
                >
                  {saving ? "Filing…" : "File ticket"}
                </Button>
                <Button variant="text" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </Actions>
            </form>
          )}
        </Panel>
      )}

      {annotating && shot && (
        <ScreenshotAnnotator
          source={shot.base}
          initialShapes={shot.shapes}
          title="Mark up the screenshot"
          onDone={(file, shapes) => {
            setShot({ base: shot.base, file, shapes });
            setAnnotating(false);
          }}
          onCancel={() => setAnnotating(false)}
        />
      )}
    </>
  );
}

/* --- styles ------------------------------------------------------------- */
/* Sits above HelpCenter's launcher rather than beside it, so the two do not
   fight for the same corner. Both are fixed to the bottom right. */



const Panel = styled.div`
  /* Opens beside the Help Center launcher, which is now the way in — the
     speed-dial actions expand upward from the same corner. */
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 9999;
  width: min(540px, calc(100vw - 48px));
  max-height: min(calc(100vh - 140px), 820px);
  overflow-y: auto;
  padding: 24px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: var(--MH-Theme-Elevation-High, 2px 2px 12px rgba(0, 0, 0, 0.19));

  input,
  select,
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }
  textarea {
    resize: vertical;
  }
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: -1px;
  }
`;

const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const Eyebrow = styled.p`
  margin: 0 0 2px;
  font: var(--MH-Type-Label-Small);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const SurfaceName = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SurfaceKey = styled.p`
  margin: 2px 0 0;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
  word-break: break-all;
`;

const CloseButton = styled.button`
  flex: none;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0 4px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  &:hover {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  flex: 1;

  label {
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Optional = styled.span`
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;


const Chord = styled.span`
  align-self: flex-start;
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  font: var(--MH-Type-Label-Small);
  white-space: nowrap;
`;

const ShotRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 4px 26px; /* aligned under the checkbox label */
`;

const Thumb = styled.span`
  position: relative;
  flex: none;
  display: block;
  width: 96px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top left;
    display: block;
  }
`;

const ThumbBadge = styled.span`
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: 1px 6px;
  border-radius: 100px;
  background: var(--MH-Theme-Warning-Base, #b9261a);
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Label-Small);
  line-height: 16px;
`;

const ShotActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
`;

const ShotButton = styled.button`
  padding: 6px 12px;
  border-radius: 100px;
  border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  font: var(--MH-Type-Label-Small);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }
  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
`;

const ShotHint = styled.span`
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Hint = styled.p`
  margin: 6px 0 0;
  font: var(--MH-Type-Body-Small);
  color: ${({ tone }) =>
    tone === "warn"
      ? "var(--MH-Theme-Warning-Dark, #8f1f14)"
      : "var(--MH-Theme-Neutrals-Dark, #6a6a6a)"};
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  input {
    width: auto;
  }
  label {
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Existing = styled.div`
  /* A heads-up, not an error: accent yellow, which the palette already uses for
     "look here" rather than the reds reserved for things that are wrong. */
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Accent-Base, #f2be42);
  background: var(--MH-Theme-Accent-Light, #fdf2d0);
`;

const ExistingHead = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ExistingCount = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 100px;
  background: var(--MH-Theme-Accent-Base, #f2be42);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Base);
`;

const ExistingTitle = styled.p`
  margin: 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const ExistingHint = styled.p`
  margin: 2px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Accent-Dark, #5d5763);
`;

const ExistingRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px 12px;
  padding: 10px 0;
  /* Always present: it separates the heading from the first ticket as well as
     tickets from each other. (A :first-of-type exception would never fire —
     the heading above is also a div.) */
  border-top: 1px solid var(--MH-Theme-Accent-Base, #f2be42);
`;

const RowTitle = styled.p`
  margin: 0;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  overflow-wrap: anywhere;
`;

const ExistingMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

/* A bordered button, not underlined text: unmistakably "go and read this",
   and visually unlike the status chip beside it. */
const ViewButton = styled.a`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  font: var(--MH-Type-Label-Small);
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: var(--MH-Theme-Primary-Light, #def8fb);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

/* The ticket's state. White with a coloured dot, NOT the board's tinted pill:
   the board's OPEN pill is Accent-Light, the same yellow as this callout, and
   would vanish against it. */
const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 100px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Label-Small);
  white-space: nowrap;

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  }
  &[data-status="OPEN"]::before {
    background: var(--MH-Theme-Warning-Base, #b9261a);
  }
  &[data-status="ACCEPTED"]::before {
    background: var(--MH-Theme-Accent-Dark, #5d5763);
  }
  &[data-status="IN_PROGRESS"]::before {
    background: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

/* A verb, capitalised, so it reads as something you do — not as a state. */
const MarkShipped = styled.button`
  justify-self: end;
  border: none;
  background: none;
  padding: 0;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Accent-Dark, #5d5763);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--MH-Theme-Success-Dark, #1d6b3a);
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;


const Tag = styled.span`
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  white-space: nowrap;

  &[data-claimed="yes"] {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const LinkButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  text-decoration: underline;
`;

const NOTICE_TONES = {
  ok: {
    background: "var(--MH-Theme-Success, #e3f4ec)",
    color: "var(--MH-Theme-Success-Dark, #1d6b3a)",
  },
  warn: {
    background: "var(--MH-Theme-Accent-Light, #fdf2d0)",
    color: "var(--MH-Theme-Warning-Dark, #8f1f14)",
  },
  error: {
    background: "var(--MH-Theme-Warning-Light, #edcecd)",
    color: "var(--MH-Theme-Warning-Base, #b9261a)",
  },
};

// Falls back rather than throwing: a mistyped tone should make a notice look
// wrong, not take the whole overlay down with it.
const tone = (props) => NOTICE_TONES[props.tone] ?? NOTICE_TONES.warn;

const Notice = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font: var(--MH-Type-Body-Small);
  background: ${(props) => tone(props).background};
  color: ${(props) => tone(props).color};

  code {
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
    font-size: 0.9em;
  }
`;
