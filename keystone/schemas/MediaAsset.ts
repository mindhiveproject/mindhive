import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";

/**
 * Reusable image URLs scoped to a board. Uploaded via Cloudinary from the client.
 *
 * `settings` JSON (expected shape):
 * {
 *   sourceType?: string | null;  // where the asset belongs in the product, e.g. projectCard, vizSection, resourceContent
 *   sourceId?: string | null;    // e.g. ProposalCard id, viz section id
 *   createdWith?: string | null; // how the file was produced, e.g. upload, paste, datatool-hv, datatool-graph
 * }
 */
export const MediaAsset = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.itemId,
      update: ({ session }) => !!session?.itemId,
      delete: ({ session }) => !!session?.itemId,
    },
    item: {
      update: ({ session, item }) =>
        !!session?.itemId && item.authorId === session.itemId,
      delete: ({ session, item }) =>
        !!session?.itemId && item.authorId === session.itemId,
    },
  },
  fields: {
    /** Original file name (without path), e.g. from upload */
    fileName: text(),
    /** User-facing customizable title */
    title: text(),
    /** Optional; may be null or incomplete (text() defaults to NOT NULL in Keystone unless db.isNullable is set). */
    description: text({
      db: { isNullable: true },
      validation: { isRequired: false },
    }),
    /** Cloudinary secure_url (or any stable HTTPS image URL) */
    url: text({ validation: { isRequired: true } }),
    /** Optional Cloudinary public_id for future management */
    publicId: text(),
    settings: json(),
    board: relationship({
      ref: "ProposalBoard.mediaAssets",
    }),
    author: relationship({
      ref: "Profile.authoredMediaAssets",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    /** Profiles who marked this asset as a favorite */
    favoriteBy: relationship({
      ref: "Profile.favoritedMediaAssets",
      many: true,
    }),
    /** Proposal cards whose content references / displays this media */
    displayedIn: relationship({
      ref: "ProposalCard.mediaAssetsDisplayedIn",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
