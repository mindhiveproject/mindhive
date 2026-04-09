// VizJournal.js
import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const VizJournal = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: any journal attached to a study/project they can see
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                {
                  study: {
                    OR: [
                      { public: { equals: true } },
                      { author: { id: { equals: session?.itemId } } },
                      {
                        collaborators: {
                          some: { id: { equals: session?.itemId } },
                        },
                      },
                    ],
                  },
                },
                {
                  project: {
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
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                {
                  study: {
                    OR: [
                      { author: { id: { equals: session?.itemId } } },
                      {
                        collaborators: {
                          some: { id: { equals: session?.itemId } },
                        },
                      },
                    ],
                  },
                },
                {
                  project: {
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
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { study: { author: { id: { equals: session?.itemId } } } },
                { project: { creator: { id: { equals: session?.itemId } } } },
              ],
            },
    },
  },
  fields: {
    title: text(),
    description: text(),
    isPublic: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    settings: json(),
    content: json(),
    study: relationship({
      ref: "Study.vizJournals",
    }),
    project: relationship({
      ref: "ProposalBoard.vizJournals",
    }),
    vizParts: relationship({
      ref: "VizPart.vizJournal",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
