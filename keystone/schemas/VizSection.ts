// VizSection.js
import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  json,
  float,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const VizSection = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: sections in chapters they can see
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              vizChapter: {
                vizPart: {
                  vizJournal: {
                    OR: [
                      { isPublic: { equals: true } },
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
                },
              },
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              vizChapter: {
                vizPart: {
                  vizJournal: {
                    OR: [
                      {
                        study: { author: { id: { equals: session?.itemId } } },
                      },
                      {
                        project: {
                          creator: { id: { equals: session?.itemId } },
                        },
                      },
                    ],
                  },
                },
              },
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              vizChapter: {
                vizPart: {
                  vizJournal: {
                    OR: [
                      {
                        study: { author: { id: { equals: session?.itemId } } },
                      },
                      {
                        project: {
                          creator: { id: { equals: session?.itemId } },
                        },
                      },
                    ],
                  },
                },
              },
            },
    },
  },
  fields: {
    title: text(),
    description: text(),
    type: select({
      options: [
        { label: "paragraph", value: "PARAGRAPH" },
        { label: "statistics", value: "STATISTICS" },
        { label: "table", value: "TABLE" },
        { label: "graph", value: "GRAPH" },
        { label: "stattest", value: "STATTEST" },
        { label: "hypvis", value: "HYPVIS" },
        { label: "code", value: "CODE" },
      ],
    }),
    isPublic: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    settings: json(),
    content: json(),
    vizChapter: relationship({
      ref: "VizChapter.vizSections",
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    position: float(),
  },
  hooks: {
    async resolveInput({ operation, resolvedData }) {
      if (operation === "create" || operation === "update") {
        resolvedData.updatedAt = new Date().toISOString();
      }
      return resolvedData;
    },
  },
});
