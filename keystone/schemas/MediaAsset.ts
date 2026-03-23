import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const MediaAsset = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: assets they authored
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    fileName: text(),
    title: text(),
    description: text({
      db: { isNullable: true },
      validation: { isRequired: false },
    }),
    url: text({ validation: { isRequired: true } }),
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
    favoriteBy: relationship({
      ref: "Profile.favoritedMediaAssets",
      many: true,
    }),
    displayedIn: relationship({
      ref: "ProposalCard.mediaAssetsDisplayedIn",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
