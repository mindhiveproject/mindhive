import { list } from "@keystone-6/core";
import { relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

// chat forum
export const Talk = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: talks where they are author or member
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { author: { id: { equals: session?.itemId } } },
                { members: { some: { id: { equals: session?.itemId } } } },
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { author: { id: { equals: session?.itemId } } },
                { members: { some: { id: { equals: session?.itemId } } } },
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.authorOfTalk",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    members: relationship({
      ref: "Profile.memberOfTalk",
      many: true,
    }),
    words: relationship({
      ref: "Word.talk",
      many: true,
    }),
    settings: json(),
    studies: relationship({
      ref: "Study.talks",
      many: true,
    }),
    classes: relationship({
      ref: "Class.talks",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
