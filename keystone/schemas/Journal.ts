import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Journal = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: own journals (creator)
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    code: text({ isIndexed: "unique" }),
    title: text({ validation: { isRequired: true } }),
    description: text(),
    creator: relationship({
      ref: "Profile.journals",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    posts: relationship({
      ref: "Post.journal",
      many: true,
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
