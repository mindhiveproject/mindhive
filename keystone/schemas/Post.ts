import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Post = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: own posts (author)
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
    title: text(),
    content: text(),
    author: relationship({
      ref: "Profile.posts",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    journal: relationship({
      ref: "Journal.posts",
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
