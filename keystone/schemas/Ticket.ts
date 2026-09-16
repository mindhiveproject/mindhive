import { list } from "@keystone-6/core";
import {
  text,
  select,
  json,
  image,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
import {
  mirrorCreate,
  mirrorUpdate,
  mirrorSupportTickets,
  touchesMirroredField,
  trashNotionPage,
} from "../lib/notionMirror";
import { assertSupportTicketLinks } from "../lib/notionUrl";

/**
 * A platform ticket, filed from the page it is about.
 *
 * The anchor is `surface` — a key from the frontend's `lib/surfaces.js`, not a
 * URL and not a DOM selector. `/dashboard/[area]/[selector]` alone serves 24
 * areas and the ids in a URL belong to one user's board, so a URL says almost
 * nothing reusable; generated styled-components class names rule out
 * selectors. A declared surface key survives refactors, renames, locale
 * switches and id changes.
 *
 * Everything else captured at filing time — the URL instance, viewport,
 * locale, role, user agent — is evidence, not identity. It lives in
 * `evidence` and nothing keys on it.
 *
 * Access is uniform on `canManageTickets`, which is simpler than `Log`'s
 * per-event filters and is the right shape while filing and triaging are the
 * same right. If filing later widens to teachers, split this into per-operation
 * rules rather than loosening the whole list.
 */
const canManageTickets = ({ session }: any) =>
  permissions.canManageTickets({ session });

export const Ticket = list({
  access: {
    operation: {
      query: canManageTickets,
      create: canManageTickets,
      update: canManageTickets,
      delete: canManageTickets,
    },
  },
  ui: {
    labelField: "title",
    listView: {
      initialColumns: ["title", "surface", "kind", "status", "createdAt"],
      initialSort: { field: "createdAt", direction: "DESC" },
    },
  },
  fields: {
    /** Surface key from the frontend registry, e.g. "dashboard.boards". */
    surface: text({
      validation: { isRequired: true },
      isIndexed: true,
      isFilterable: true,
    }),
    title: text({ validation: { isRequired: true } }),
    kind: select({
      type: "enum",
      options: [
        { label: "Bug — something is broken", value: "BUG" },
        { label: "Design drift — ships differently than designed", value: "DESIGN_DRIFT" },
        { label: "Missing — something should be here and isn't", value: "MISSING" },
        { label: "Copy — wording, translation, tone", value: "COPY" },
        { label: "Idea — worth considering, not a defect", value: "IDEA" },
      ],
      defaultValue: "BUG",
      isFilterable: true,
    }),
    status: select({
      type: "enum",
      options: [
        { label: "Open", value: "OPEN" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Won't fix", value: "WONTFIX" },
      ],
      defaultValue: "OPEN",
      isFilterable: true,
    }),
    priority: select({
      type: "enum",
      options: [
        { label: "Low", value: "LOW" },
        { label: "Normal", value: "NORMAL" },
        { label: "High", value: "HIGH" },
      ],
      defaultValue: "NORMAL",
      isFilterable: true,
    }),
    /** TipTap document — the editor is already in the frontend. */
    body: json(),
    /**
     * Capture context. Expected shape:
     * {
     *   url?: string;          // the instance URL, for reference only
     *   route?: string;        // router.pathname — the pattern
     *   area?: string | null;
     *   selector?: string | null;
     *   viewport?: { width: number; height: number };
     *   locale?: string;
     *   roles?: string[];      // reporter's permission names at filing time
     *   userAgent?: string;
     *   domHint?: string;      // best-effort selector, a hint and never an anchor
     *   commits?: string[];    // shas that moved this ticket, added by CI
     * }
     */
    evidence: json(),
    /**
     * Filing-time screenshot. Admin-only by the list access above, and pruned
     * on a schedule once resolved — a capture of a live class or board can
     * contain student names and responses. The overlay refuses to capture on
     * /participate routes at all.
     */
    screenshot: image({ storage: "ticketScreenshots" }),
    /**
     * Where the *intended* design lives — a Figma URL pasted by the reporter.
     *
     * Distinct from `figmaNodeId` below, which records a frame captured FROM
     * the shipped page. This one points the other way: at what the surface was
     * supposed to look like. A drift ticket carrying both is a before/after
     * pair, and that is the whole argument of the ticket in one place.
     *
     * Stored as the pasted URL rather than parsed into file key + node id: the
     * URL is what a human can click, and the parts are three lines to derive
     * wherever they are needed (`lib/figmaUrl.js`). Two stored copies of the
     * same fact would only drift apart.
     */
    figmaDesignUrl: text(),
    /**
     * Support tickets this ticket answers — pages in the Notion Support
     * tickets database, which the Help Center's support form feeds. A list of
     * their Notion links, as pasted.
     *
     * Links, not page ids, for the same reason as figmaDesignUrl: a link is
     * what a person can click, and the id is derived wherever it is needed
     * (`lib/notionUrl.ts`). The mirror turns them into the Notion page's
     * "Support tickets" relation.
     */
    supportTickets: json(),
    /** Figma frame captured from this surface while resolving the ticket. */
    figmaNodeId: text(),
    /** Set by the Notion mirror, never by a human. */
    notionPageId: text({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Written by the Notion mirror. Do not edit.",
      },
    }),
    reporter: relationship({ ref: "Profile.tickets" }),
    /** Collaborators' markups of the screenshot, one per person per save. */
    annotations: relationship({ ref: "TicketAnnotation.ticket", many: true }),
    assignee: relationship({ ref: "Profile.assignedTickets" }),
    // Optional domain context, following Log's pattern: a ticket about a board
    // can name the board it was filed from without that becoming its identity.
    proposal: relationship({ ref: "ProposalBoard.tickets" }),
    class: relationship({ ref: "Class.tickets" }),
    study: relationship({ ref: "Study.tickets" }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    updatedAt: timestamp(),
    /** When status last moved to SHIPPED or WONTFIX — drives screenshot pruning. */
    resolvedAt: timestamp(),
  },
  hooks: {
    resolveInput: ({ operation, resolvedData, inputData, item }) => {
      const data: Record<string, unknown> = { ...resolvedData };

      // Checked against the raw input rather than resolvedData: on SQLite the
      // json field has already turned the list into a string by this point.
      // Refusing a wrong paste here means it fails where it was made, rather
      // than later and silently in the Notion mirror.
      if (inputData.supportTickets !== undefined) {
        assertSupportTicketLinks(inputData.supportTickets);
      }

      if (operation === "update") {
        data.updatedAt = new Date().toISOString();
      }

      // Stamp resolvedAt on the transition into a resolved state, and clear it
      // on the way back out, so pruning never deletes the screenshot of a
      // ticket that has been reopened.
      const resolved = new Set(["SHIPPED", "WONTFIX"]);
      const nextStatus = resolvedData.status ?? (item as any)?.status;
      const wasResolved = resolved.has((item as any)?.status);
      const isResolved = resolved.has(nextStatus);
      if (isResolved && !wasResolved) {
        data.resolvedAt = new Date().toISOString();
      } else if (!isResolved && wasResolved) {
        data.resolvedAt = null;
      }

      // Keystone text() columns are non-nullable: "no value" is "", and an
      // explicit null is rejected by the field's own validateInput as
      // "Figma Design Url is required" — even though the field is optional.
      // resolveInput runs before that check, so normalise null here. Any
      // client may reasonably send null for "no link" (the Admin UI does), so
      // this belongs on the server, not only in the one form that caused it.
      if (data.figmaDesignUrl === null) data.figmaDesignUrl = "";

      // A wrong link is worse than none: it looks authoritative and only
      // fails when someone clicks it. Empty is always allowed. The link kinds
      // must match FIGMA_URL in the frontend's lib/figmaUrl.js — when they
      // differed, the panel called a Make link valid and this rejected it.
      const url = data.figmaDesignUrl;
      if (typeof url === "string" && url.trim() !== "") {
        const trimmed = url.trim();
        if (!/^https:\/\/(www\.)?figma\.com\/(design|file|board|proto|make)\//.test(trimmed)) {
          throw new Error(
            "figmaDesignUrl must be a figma.com link, e.g. https://www.figma.com/design/<key>/<name>?node-id=1-2"
          );
        }
        data.figmaDesignUrl = trimmed;
      }

      return data;
    },

    // Keystone does not cascade deletes. Without this, a deleted ticket's
    // markups would be left pointing at nothing, and the prune — which
    // reaches images only through resolved tickets — would never expire
    // them. Deleting through the API rather than Prisma runs each markup's
    // own hooks, so its file leaves the disk and its copy leaves Notion.
    beforeOperation: async ({ operation, item, context }) => {
      if (operation !== "delete" || !item) return;
      const annotations = await context.sudo().db.TicketAnnotation.findMany({
        where: { ticket: { id: { equals: String((item as any).id) } } },
      });
      if (annotations.length) {
        await context.sudo().db.TicketAnnotation.deleteMany({
          where: annotations.map((annotation: any) => ({ id: String(annotation.id) })),
        });
      }
    },

    // Mirrors to Notion after the write has landed, so a Notion problem can
    // never roll back or block a ticket. `mirrorCreate` writes notionPageId
    // back with sudo, which re-enters this hook — harmless, because
    // notionPageId is not a mirrored field, so the guard below stops there.
    afterOperation: async ({ operation, item, originalItem, resolvedData, context }) => {
      if (operation === "delete") {
        await trashNotionPage((originalItem as any)?.notionPageId || null);
        return;
      }

      const id = (item as any)?.id;
      if (!id) return;

      if (operation === "create") {
        await mirrorCreate(context, String(id));
        return;
      }
      if (operation === "update" && touchesMirroredField(resolvedData ?? {})) {
        await mirrorUpdate(context, String(id));
      }
      // Its own path: the relation is edited as a change (links added and
      // removed here), not overwritten, so links made directly in Notion stay.
      if (operation === "update" && resolvedData?.supportTickets !== undefined) {
        await mirrorSupportTickets(context, String(id), (originalItem as any)?.supportTickets);
      }
    },
  },
});
