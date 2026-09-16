import { list } from "@keystone-6/core";
import { text, image, relationship, timestamp } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { mirrorAnnotation, removeNotionBlock } from "../lib/notionMirror";

/**
 * One collaborator's markup of a ticket's screenshot.
 *
 * Each person saves their own copy — the original screenshot with their marks
 * drawn on — rather than everyone editing one shared drawing. Nothing anyone
 * draws can overwrite what someone else drew, and there is no real-time sync
 * to build. If separate copies ever prove not to be enough, the platform
 * already runs the Hocuspocus server a live shared canvas would need.
 *
 * The image holds the same pixels as the ticket's screenshot, so it inherits
 * the same handling: the same bucket, the same canManageTickets gate on the
 * record, and the same 90-day prune after the ticket is resolved.
 */
const canManageTickets = ({ session }: any) => permissions.canManageTickets({ session });

export const TicketAnnotation = list({
  access: {
    operation: {
      query: canManageTickets,
      create: canManageTickets,
      update: canManageTickets,
      delete: canManageTickets,
    },
  },
  ui: {
    listView: { initialColumns: ["ticket", "author", "note", "createdAt"] },
  },
  fields: {
    ticket: relationship({ ref: "Ticket.annotations" }),
    author: relationship({ ref: "Profile.ticketAnnotations" }),
    /** The screenshot with this person's marks drawn in. Cleared by the prune. */
    image: image({ storage: "ticketScreenshots" }),
    /** What the marks mean, in words. Kept after the image is pruned. */
    note: text(),
    /** The image block on the ticket's Notion page. Set by the Notion mirror, never by a human. */
    notionBlockId: text({
      ui: {
        itemView: { fieldMode: "read" },
        description: "Written by the Notion mirror. Do not edit.",
      },
    }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
  },
  hooks: {
    // `note` is a non-nullable text() column, and null is rejected as "Note is
    // required" even though the field is optional — the same trap figmaDesignUrl
    // fell into on Ticket. Normalise it here so no client can hit it.
    resolveInput: ({ resolvedData }) => {
      const data: Record<string, unknown> = { ...resolvedData };
      if (data.note === null) data.note = "";
      return data;
    },

    // After the write, so a Notion problem can never block saving a markup.
    afterOperation: async ({ operation, item, originalItem, context }) => {
      if (operation === "create" && item?.id) {
        await mirrorAnnotation(context, String(item.id));
      }
      // Deleting a markup takes its copy off the Notion page as well. Left
      // there, it would outlive the original until the ticket's screenshots
      // expire — or for good, on a ticket that is never resolved.
      if (operation === "delete") {
        await removeNotionBlock((originalItem as any)?.notionBlockId || null);
      }
    },
  },
});
