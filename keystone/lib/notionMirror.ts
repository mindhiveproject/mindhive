import { Client } from "@notionhq/client";
import { readFile } from "fs/promises";
import path from "path";
import { notionPageIdFromUrl, sameNotionId } from "./notionUrl";

/**
 * Mirrors tickets into Notion, one way.
 *
 * Keystone is the system of record. Notion is where people who do not live in
 * the app read and plan, so it gets a copy — but a status changed in Notion
 * will be overwritten on the ticket's next update here. That is deliberate: two
 * systems that both think they are authoritative is the problem this whole
 * branch exists to fix.
 *
 * Best-effort by design. A Notion outage, a revoked token or a renamed property
 * must never fail a ticket write — the ticket is the thing that matters and it
 * is already safely in Postgres. Failures are logged and leave `notionPageId`
 * null, which is also how you find the rows that still need mirroring.
 *
 * Config (keystone/.env):
 *   NOTION_KEY         internal integration secret
 *   NOTION_TICKETS_DB  the database id (not the data source id — see below)
 *   NOTION_SUPPORT_TICKETS_DB  optional: the Support tickets database, whose
 *                      pages a ticket can link to. Needs the "Support tickets"
 *                      relation, made once by scripts/setup-notion-support-relation.js
 *
 * With either of the first two missing the mirror silently does nothing, so a
 * developer without Notion credentials can still file tickets locally.
 */

// The same API version pins as the frontend's /api/notion route.
const NOTION_VERSION = "2025-09-03";

/** Property names, as created in the Tickets database. Change both together. */
const PROP = {
  title: "Title",
  status: "Status",
  kind: "Kind",
  priority: "Priority",
  surface: "Surface",
  reporter: "Reporter",
  filed: "Filed",
  mindhiveId: "MindHive ID",
  link: "Link",
  design: "Design",
  assignee: "Assignee",
  /** A relation to the Support tickets database; see mirrorSupportTickets. */
  support: "Support tickets",
} as const;

/** Keystone enum -> the option names in the Notion select. */
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  SHIPPED: "Shipped",
  WONTFIX: "Won't fix",
};

const KIND_LABELS: Record<string, string> = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

/** Fields whose change is worth a Notion round trip. */
export const MIRRORED_FIELDS = [
  "title",
  "status",
  "kind",
  "priority",
  "surface",
  "figmaDesignUrl",
  "assignee",
] as const;

let client: Client | null = null;
function getClient(): Client | null {
  if (!process.env.NOTION_KEY || !process.env.NOTION_TICKETS_DB) return null;
  if (!client) {
    client = new Client({
      auth: process.env.NOTION_KEY,
      notionVersion: NOTION_VERSION,
    });
  }
  return client;
}

/**
 * Pages are parented to a *data source*, not a database, on 2025-09-03. The
 * data source id is resolved from the database id, so `.env` holds the id a
 * human can actually copy out of a Notion URL.
 *
 * Looked up on every create rather than cached, to catch a database that has
 * been moved to Notion's trash. Notion still accepts new pages into a trashed
 * database, so the mirror used to "succeed": the ticket got a notionPageId,
 * and nobody could see the page. Refusing leaves notionPageId null instead —
 * the ticket page then shows no Notion link, and the ticket's next update
 * after the database is restored mirrors it properly. One GET per filing.
 */
async function getDataSourceId(notion: Client): Promise<string> {
  const database: any = await notion.databases.retrieve({
    database_id: process.env.NOTION_TICKETS_DB as string,
  });
  if (database.in_trash || database.archived) {
    throw new Error(
      "the Tickets database is in Notion's trash. Restore it (Notion → Trash → Tickets), " +
        "or point NOTION_TICKETS_DB at another database."
    );
  }
  const sources = database.data_sources ?? [];
  if (!sources.length) {
    throw new Error(
      "Tickets database has no data source; API 2025-09-03 requires one."
    );
  }
  return sources[0].id as string;
}

const text = (value: unknown) =>
  value == null || value === ""
    ? []
    : [{ type: "text" as const, text: { content: String(value).slice(0, 2000) } }];

const select = (labels: Record<string, string>, value: unknown) => {
  const name = labels[String(value)];
  return name ? { name } : null;
};

function ticketUrl(id: string): string | null {
  const base =
    process.env.NODE_ENV === "development"
      ? process.env.FRONTEND_URL_DEV
      : process.env.FRONTEND_URL;
  return base ? `${base.replace(/\/$/, "")}/dashboard/tickets/${id}` : null;
}

function propertiesFor(ticket: any) {
  const link = ticketUrl(ticket.id);
  return {
    [PROP.title]: { title: text(ticket.title) },
    [PROP.status]: { select: select(STATUS_LABELS, ticket.status) },
    [PROP.kind]: { select: select(KIND_LABELS, ticket.kind) },
    [PROP.priority]: { select: select(PRIORITY_LABELS, ticket.priority) },
    // Surface options are created on the fly — which is why this is a `select`
    // and not Notion's `status` type, whose options the API cannot create.
    [PROP.surface]: { select: ticket.surface ? { name: ticket.surface } : null },
    [PROP.reporter]: { rich_text: text(ticket.reporter?.username) },
    [PROP.filed]: {
      date: ticket.createdAt ? { start: new Date(ticket.createdAt).toISOString() } : null,
    },
    [PROP.mindhiveId]: { rich_text: text(ticket.id) },
    ...(link ? { [PROP.link]: { url: link } } : {}),
    // Where the intended design lives, when the reporter supplied it. A
    // url property accepts null cleanly, so no conditional spread needed.
    [PROP.design]: { url: ticket.figmaDesignUrl || null },
    // Cleared to an empty rich_text when unassigned, so releasing a ticket in
    // the app releases it in Notion too rather than leaving a stale name.
    [PROP.assignee]: { rich_text: text(ticket.assignee?.username) },
  };
}

/**
 * The written description becomes page content rather than a property, so long
 * reports stay readable.
 */
function childrenFor(ticket: any) {
  const description = ticket.body?.text;
  if (!description) return [];
  return [
    {
      object: "block" as const,
      type: "paragraph" as const,
      paragraph: { rich_text: text(description) },
    },
  ];
}

/*
 * Screenshots ARE mirrored — a deliberate decision, reversed from the first
 * version, made knowing the tradeoff:
 *
 *   A capture can contain student names and responses. In MindHive it expires
 *   90 days after the ticket is resolved. Copying it into Notion puts it in
 *   front of whoever can open the Platform tickets page, so it is only
 *   appropriate while that audience is the same people who hold
 *   canManageTickets. If the Notion page is ever shared more widely, turn this
 *   off (NOTION_MIRROR_SCREENSHOTS=false).
 *
 * The expiry is kept: pruneTicketScreenshots calls removeScreenshotFromNotion,
 * so the Notion copy is removed on the same schedule. One caveat stated
 * plainly — Notion's delete is a soft delete. A removed block sits in the
 * workspace trash, restorable by members for up to 30 days, so the effective
 * ceiling in Notion is 90 days plus that.
 *
 * The file is uploaded INTO Notion (its file upload API) rather than embedded
 * by URL. An embed would hand Notion the public Keystone URL, and would break
 * the moment screenshots require a login. It is read from disk for the same
 * reason, never fetched over HTTP.
 */

/** Mirrors `storagePath` for ticketScreenshots in keystone.ts. */
const SCREENSHOT_DIR = "ticket-screenshots";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function screenshotsEnabled(): boolean {
  return process.env.NOTION_MIRROR_SCREENSHOTS !== "false";
}

const FILING_CAPTION =
  "Screenshot at filing time. Removed automatically 90 days after the ticket is resolved.";

/**
 * Upload an image (a screenshot or a markup of one) into Notion and append it
 * to the page. Returns the new block's id, or null if nothing was attached.
 */
async function attachScreenshot(
  notion: Client,
  pageId: string,
  screenshot: any,
  caption: string = FILING_CAPTION
): Promise<string | null> {
  if (!screenshotsEnabled() || !screenshot?.id || !screenshot?.extension) return null;

  const extension = String(screenshot.extension).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return null; // not an image Notion will render

  // The image field stores "2026/09/<ts>-<rand>"; Keystone adds the extension.
  const file = path.join(process.cwd(), SCREENSHOT_DIR, `${screenshot.id}.${extension}`);
  const bytes = await readFile(file);
  const filename = path.basename(file);

  const upload: any = await notion.fileUploads.create({
    mode: "single_part",
    filename,
    content_type: contentType,
  });
  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: { filename, data: new Blob([bytes], { type: contentType }) },
  });
  const appended: any = await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: "block",
        type: "image",
        image: {
          type: "file_upload",
          file_upload: { id: upload.id },
          caption: text(caption),
        },
      } as any,
    ],
  });
  return appended?.results?.[0]?.id ?? null;
}

/**
 * Ids of every image block on a mirrored page. Paginated: a long description
 * plus a markup from each collaborator can run past the API's 100 per page,
 * and an image on page two would otherwise survive the prune.
 */
async function imageBlockIds(notion: Client, pageId: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page: any = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });
    for (const block of page.results ?? []) {
      if (block.type === "image") ids.push(block.id);
    }
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return ids;
}

/** Whether a mirrored page already carries an image — keeps backfills idempotent. */
async function pageHasImage(notion: Client, pageId: string): Promise<boolean> {
  return (await imageBlockIds(notion, pageId)).length > 0;
}

/**
 * Upload a ticket's screenshot to its existing Notion page, if the page does
 * not already have one. For tickets mirrored before screenshots were, and for
 * catching up after NOTION_MIRROR_SCREENSHOTS is switched back on.
 * Returns what happened, for the backfill's report.
 */
export async function backfillScreenshotToNotion(
  context: any,
  ticketId: string,
  { dryRun = true }: { dryRun?: boolean } = {}
): Promise<"attached" | "would-attach" | "already-there" | "no-screenshot" | "not-mirrored" | "disabled"> {
  const notion = getClient();
  if (!notion || !screenshotsEnabled()) return "disabled";
  const ticket = await loadTicket(context, ticketId);
  if (!ticket?.notionPageId) return "not-mirrored";
  if (!ticket.screenshot?.id) return "no-screenshot";
  if (await pageHasImage(notion, ticket.notionPageId)) return "already-there";
  if (dryRun) return "would-attach";
  await attachScreenshot(notion, ticket.notionPageId, ticket.screenshot);
  return "attached";
}

/**
 * Copy one collaborator's markup onto the ticket's Notion page, captioned with
 * who drew it, when, and their note. Appended below the filing screenshot, so
 * the page reads as the original followed by each person's markup in order.
 * Best-effort, like the rest of the mirror.
 */
export async function mirrorAnnotation(context: any, annotationId: string): Promise<void> {
  const notion = getClient();
  if (!notion || !screenshotsEnabled()) return;
  try {
    const annotation = await context.sudo().query.TicketAnnotation.findOne({
      where: { id: annotationId },
      query: "id note createdAt author { username } image { id extension } ticket { notionPageId }",
    });
    if (!annotation?.ticket?.notionPageId || !annotation.image?.id) return;
    const who = annotation.author?.username ?? "someone";
    const when = new Date(annotation.createdAt).toISOString().slice(0, 10);
    const note = annotation.note?.trim();
    const caption =
      `Annotated by ${who} on ${when}${note ? ` — ${note}` : ""}. ` +
      "Removed with the screenshot, 90 days after the ticket is resolved.";
    const blockId = await attachScreenshot(
      notion,
      annotation.ticket.notionPageId,
      annotation.image,
      caption
    );
    // Kept so deleting the annotation removes exactly this image from the page.
    if (blockId) {
      await context.sudo().db.TicketAnnotation.updateOne({
        where: { id: annotationId },
        data: { notionBlockId: blockId },
      });
    }
  } catch (error: any) {
    console.error(
      `[notionMirror] annotation mirror failed for ${annotationId}: ${error?.message ?? error}`
    );
  }
}

/** Remove one mirrored markup — its annotation was deleted in MindHive. */
export async function removeNotionBlock(blockId: string | null): Promise<void> {
  const notion = getClient();
  if (!notion || !blockId) return;
  try {
    await notion.blocks.delete({ block_id: blockId });
  } catch (error: any) {
    console.error(
      `[notionMirror] removing block ${blockId} failed: ${error?.message ?? error}`
    );
  }
}

/**
 * Move a deleted ticket's page to Notion's trash. The mirror is one way, so a
 * page for a ticket that no longer exists is drift — and it still carries the
 * ticket's screenshots, which the prune could then never reach. Trash is the
 * only delete the API offers; members can restore the page for 30 days.
 */
export async function trashNotionPage(notionPageId: string | null): Promise<void> {
  const notion = getClient();
  if (!notion || !notionPageId) return;
  try {
    await notion.pages.update({ page_id: notionPageId, in_trash: true });
  } catch (error: any) {
    console.error(
      `[notionMirror] trashing page ${notionPageId} failed: ${error?.message ?? error}`
    );
  }
}

/**
 * Remove the screenshot from a mirrored page. Called by the prune job so the
 * Notion copy expires on the same schedule as the original. Every image block
 * on a mirrored page is ours — the filing screenshot and each collaborator's
 * markup — so removing all of them expires the markups along with it.
 */
export async function removeScreenshotFromNotion(notionPageId: string | null): Promise<void> {
  const notion = getClient();
  if (!notion || !notionPageId) return;
  try {
    // Collected before deleting, so removals cannot shift the pagination.
    for (const blockId of await imageBlockIds(notion, notionPageId)) {
      await notion.blocks.delete({ block_id: blockId });
    }
  } catch (error: any) {
    console.error(
      `[notionMirror] screenshot removal failed for page ${notionPageId}: ${error?.message ?? error}`
    );
  }
}

/* ---- support tickets ---------------------------------------------------- */

/**
 * A ticket links support tickets — pages in the Support tickets database — and
 * the mirror shows them as the "Support tickets" relation, which Notion also
 * shows from the other side as "Platform tickets" on each support ticket.
 *
 * Unlike every other property, this one is not overwritten from MindHive.
 * People already link support tickets by hand in Notion, and a relation is
 * easy to edit there, so the mirror merges rather than replaces: every link
 * saved on the platform is on the page, links unlinked on the platform are
 * taken off it, and a link made directly in Notion is never removed. (It does
 * not show on the platform either: this stays a one-way mirror.)
 */

function supportDatabaseId(): string | null {
  return process.env.NOTION_SUPPORT_TICKETS_DB || null;
}

/** The field arrives parsed through the API, but as a JSON string from a raw SQLite row. */
function supportLinks(value: unknown): string[] {
  let list = value;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  return Array.isArray(list) ? list.filter((link) => typeof link === "string") : [];
}

function supportIds(value: unknown): string[] {
  return supportLinks(value)
    .map((link) => notionPageIdFromUrl(link))
    .filter((id): id is string => !!id);
}

/** The page's current relation, or null if the property has not been set up. */
async function currentSupportIds(notion: Client, pageId: string): Promise<string[] | null> {
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const property = page.properties?.[PROP.support];
  if (!property || property.type !== "relation") return null;
  if (!property.has_more) return (property.relation ?? []).map((r: any) => r.id);
  // More than 25 related pages: the page object is truncated, so page through.
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: property.id,
      start_cursor: cursor,
    });
    ids.push(...(res.results ?? []).map((item: any) => item.relation?.id).filter(Boolean));
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return ids;
}

type SupportOutcome = "linked" | "would-link" | "unchanged" | "not-set-up" | "failed";

/**
 * Bring a page's relation in line with the ticket: every link saved on the
 * platform present, those unlinked there (`before` but not `after`) removed,
 * anything else already on the page kept.
 *
 * The whole saved set, not only what just changed: a write that failed earlier
 * — Notion unreachable, the relation not set up yet — is then repaired by the
 * next one, instead of that link silently never reaching Notion.
 *
 * Best-effort: Notion refuses the whole write if one page is outside the
 * Support tickets database or not shared with the integration, and that must
 * not affect anything else the mirror does.
 */
async function writeSupportRelation(
  notion: Client,
  pageId: string,
  before: string[],
  after: string[],
  ticketId: string,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<SupportOutcome> {
  if (!supportDatabaseId()) return "not-set-up";
  const removed = before.filter((id) => !after.some((a) => sameNotionId(a, id)));
  if (!after.length && !removed.length) return "unchanged";
  try {
    const current = await currentSupportIds(notion, pageId);
    if (current === null) {
      console.error(
        `[notionMirror] the Tickets database has no "${PROP.support}" relation; ` +
          "run scripts/setup-notion-support-relation.js"
      );
      return "not-set-up";
    }
    const next = [
      ...current.filter((id) => !removed.some((r) => sameNotionId(r, id))),
      ...after.filter((id) => !current.some((c) => sameNotionId(c, id))),
    ];
    const same =
      next.length === current.length && next.every((id) => current.some((c) => sameNotionId(c, id)));
    if (same) return "unchanged";
    if (dryRun) return "would-link";
    await notion.pages.update({
      page_id: pageId,
      properties: { [PROP.support]: { relation: next.map((id) => ({ id })) } } as any,
    });
    return "linked";
  } catch (error: any) {
    console.error(
      `[notionMirror] support tickets not linked for ticket ${ticketId}: ${error?.message ?? error}`
    );
    return "failed";
  }
}

/**
 * Link support tickets that were saved on the platform before the Support
 * tickets relation existed, or while Notion was unreachable. Only ever adds,
 * so it is safe to re-run. One line per ticket that has links, for the report.
 */
export async function backfillSupportTicketsToNotion(
  context: any,
  { dryRun = true }: { dryRun?: boolean } = {}
): Promise<string[]> {
  const notion = getClient();
  if (!notion || !supportDatabaseId()) {
    return ["disabled: Notion or NOTION_SUPPORT_TICKETS_DB is not configured"];
  }
  const tickets = await context.sudo().query.Ticket.findMany({
    where: { notionPageId: { not: { equals: "" } } },
    query: "id title notionPageId supportTickets",
  });
  const results: string[] = [];
  for (const ticket of tickets) {
    const ids = supportIds(ticket.supportTickets);
    if (!ids.length) continue;
    const outcome = await writeSupportRelation(notion, ticket.notionPageId, [], ids, ticket.id, {
      dryRun,
    });
    results.push(`${outcome}: ${ticket.title}`);
  }
  return results;
}

/** After a ticket's support links change: carry the change to its Notion page. */
export async function mirrorSupportTickets(
  context: any,
  ticketId: string,
  before: unknown
): Promise<void> {
  const notion = getClient();
  if (!notion || !supportDatabaseId()) return;
  try {
    const ticket = await loadTicket(context, ticketId);
    if (!ticket) return;
    // Never mirrored (Notion was down when it was filed): as in mirrorUpdate,
    // treat this as the create it never got, which links them all.
    if (!ticket.notionPageId) {
      await mirrorCreate(context, ticketId);
      return;
    }
    await writeSupportRelation(
      notion,
      ticket.notionPageId,
      supportIds(before),
      supportIds(ticket.supportTickets),
      ticketId
    );
  } catch (error: any) {
    console.error(
      `[notionMirror] support tickets not linked for ticket ${ticketId}: ${error?.message ?? error}`
    );
  }
}

/**
 * What each pasted link points at, so the platform can show a support
 * ticket's title and flag a link that will not work before it is relied on.
 *   ok             a page in the Support tickets database
 *   not-support    a Notion page, but not a support ticket
 *   not-visible    no such page, or not shared with the integration
 *   invalid        not a link to a Notion page
 *   unchecked      Notion or the Support tickets database is not configured
 */
export async function previewSupportTickets(urls: string[]) {
  const notion = getClient();
  const database = supportDatabaseId();
  return Promise.all(
    urls.map(async (url) => {
      const pageId = notionPageIdFromUrl(url);
      if (!pageId) return { url, pageId: null, title: null, state: "invalid" };
      if (!notion || !database) return { url, pageId, title: null, state: "unchecked" };
      try {
        const page: any = await notion.pages.retrieve({ page_id: pageId });
        if (page.in_trash) return { url, pageId, title: null, state: "not-visible" };
        const titleProperty: any = Object.values(page.properties ?? {}).find(
          (property: any) => property.type === "title"
        );
        const title =
          (titleProperty?.title ?? []).map((part: any) => part.plain_text).join("") || null;
        const inSupport = sameNotionId(page.parent?.database_id, database);
        return { url, pageId, title, state: inSupport ? "ok" : "not-support" };
      } catch {
        return { url, pageId, title: null, state: "not-visible" };
      }
    })
  );
}

/** Load the fields the mirror needs, with the reporter resolved. */
async function loadTicket(context: any, id: string) {
  return context.sudo().query.Ticket.findOne({
    where: { id },
    query: `
      id title surface kind status priority body createdAt notionPageId
      figmaDesignUrl supportTickets
      reporter { username }
      assignee { username }
      screenshot { id extension }
    `,
  });
}

/** Create the Notion page for a new ticket and record its id. */
export async function mirrorCreate(context: any, ticketId: string): Promise<void> {
  const notion = getClient();
  if (!notion) return;

  try {
    const ticket = await loadTicket(context, ticketId);
    if (!ticket || ticket.notionPageId) return;

    const page: any = await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: await getDataSourceId(notion) },
      properties: propertiesFor(ticket) as any,
      children: childrenFor(ticket) as any,
    });

    // Written with sudo because the hook runs as whoever filed the ticket, and
    // notionPageId is read-only in the Admin UI by design.
    await context.sudo().query.Ticket.updateOne({
      where: { id: ticketId },
      data: { notionPageId: page.id },
    });

    // After the page id is saved, so a failed upload still leaves a correctly
    // linked page rather than an unlinked one. Its own try: a screenshot that
    // will not upload must not be reported as a failed mirror.
    try {
      await attachScreenshot(notion, page.id, ticket.screenshot);
    } catch (error: any) {
      console.error(
        `[notionMirror] screenshot upload failed for ticket ${ticketId}: ${error?.message ?? error}`
      );
    }

    // Separate from the create for the same reason: one link Notion refuses
    // must not cost the ticket its page.
    await writeSupportRelation(notion, page.id, [], supportIds(ticket.supportTickets), ticketId);
  } catch (error: any) {
    console.error(
      `[notionMirror] create failed for ticket ${ticketId}: ${error?.message ?? error}`
    );
  }
}

/** Push a changed ticket to its existing Notion page. */
export async function mirrorUpdate(context: any, ticketId: string): Promise<void> {
  const notion = getClient();
  if (!notion) return;

  try {
    const ticket = await loadTicket(context, ticketId);
    if (!ticket) return;

    // Never mirrored on create (Notion was down, credentials were missing) —
    // treat the first update as the create it never got.
    if (!ticket.notionPageId) {
      await mirrorCreate(context, ticketId);
      return;
    }

    await notion.pages.update({
      page_id: ticket.notionPageId,
      properties: propertiesFor(ticket) as any,
    });
  } catch (error: any) {
    console.error(
      `[notionMirror] update failed for ticket ${ticketId}: ${error?.message ?? error}`
    );
  }
}

/** Whether a Keystone update touched anything Notion shows. */
export function touchesMirroredField(resolvedData: Record<string, unknown>): boolean {
  return MIRRORED_FIELDS.some((field) => resolvedData[field] !== undefined);
}
