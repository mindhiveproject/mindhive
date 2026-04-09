import { list } from "@keystone-6/core";
import { text, relationship, timestamp, float } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const ProposalSection = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: sections whose board they can access (same rules as ProposalBoard.query)
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              board: {
                OR: [
                  { creator: { id: { equals: session?.itemId } } },
                  { author: { id: { equals: session?.itemId } } },
                  {
                    collaborators: {
                      some: { id: { equals: session?.itemId } },
                    },
                  },
                  {
                    usedInClass: {
                      OR: [
                        { creator: { id: { equals: session?.itemId } } },
                        {
                          mentors: {
                            some: { id: { equals: session?.itemId } },
                          },
                        },
                        {
                          students: {
                            some: { id: { equals: session?.itemId } },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              board: {
                OR: [
                  { creator: { id: { equals: session?.itemId } } },
                  { author: { id: { equals: session?.itemId } } },
                  {
                    collaborators: {
                      some: { id: { equals: session?.itemId } },
                    },
                  },
                ],
              },
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              board: {
                creator: { id: { equals: session?.itemId } },
              },
            },
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    publicId: text(),
    description: text(),
    position: float(),
    board: relationship({
      ref: "ProposalBoard.sections",
    }),
    cards: relationship({
      ref: "ProposalCard.section",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
