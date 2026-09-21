import { list } from "@keystone-6/core";
import { text, timestamp } from "@keystone-6/core/fields";
import { permissions } from "../access";

/**
 * Which Figma file a surface is designed in — the map behind the ticket
 * panel's suggested design link.
 *
 * Keys are surface keys from the frontend's `lib/surfaces.js` and are dotted,
 * so `builder.projects.start` sits under `builder.projects`, which sits under
 * `builder`. A row is an *override*: it exists only where someone filed a
 * ticket with a link different from what the panel would already have
 * suggested. A surface with no row inherits its nearest ancestor's, so
 * changing a parent's link moves every child that never set its own, with
 * nothing copied down to go stale.
 *
 * Group keys that are not surfaces themselves (`builder`, `dashboard`) can be
 * added by hand in the Admin UI as a fallback for everything beneath them.
 *
 * Written by Ticket's afterOperation hook, which is the only path that needs
 * it; the panel only reads.
 */
const canManageTickets = ({ session }: any) => permissions.canManageTickets({ session });

export const SurfaceDesign = list({
  access: {
    operation: {
      query: canManageTickets,
      create: canManageTickets,
      update: canManageTickets,
      delete: canManageTickets,
    },
  },
  ui: {
    labelField: "surface",
    listView: {
      initialColumns: ["surface", "figmaDesignUrl", "updatedAt"],
      initialSort: { field: "surface", direction: "ASC" },
    },
  },
  fields: {
    surface: text({
      validation: { isRequired: true },
      isIndexed: "unique",
    }),
    /** A figma.com link, as pasted. Same shape as Ticket.figmaDesignUrl. */
    figmaDesignUrl: text({ validation: { isRequired: true } }),
    updatedAt: timestamp({ defaultValue: { kind: "now" } }),
  },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation === "update") return { ...resolvedData, updatedAt: new Date().toISOString() };
      return resolvedData;
    },
  },
});
