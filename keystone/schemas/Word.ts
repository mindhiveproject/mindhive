import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

// chat message
export const Word = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: messages they authored or in talks they are member/author
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { author: { id: { equals: session?.itemId } } },
                {
                  talk: {
                    OR: [
                      { author: { id: { equals: session?.itemId } } },
                      {
                        members: {
                          some: { id: { equals: session?.itemId } },
                        },
                      },
                    ],
                  },
                },
              ],
            },
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
    author: relationship({
      ref: "Profile.authorOfWord",
      hooks: {
        async resolveInput({ context }) {
          return { connect: { id: context.session.itemId } };
        },
      },
    }),
    talk: relationship({
      ref: "Talk.words",
    }),
    message: text(),
    new: checkbox(),
    settings: json(),
    isMain: checkbox(),
    parent: relationship({
      ref: "Word.children",
    }),
    children: relationship({
      ref: "Word.parent",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
