// VizPart.js
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

export const VizPart = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: parts in journals they can see
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
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
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              vizJournal: {
                OR: [
                  { study: { author: { id: { equals: session?.itemId } } } },
                  { project: { creator: { id: { equals: session?.itemId } } } },
                ],
              },
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              vizJournal: {
                OR: [
                  { study: { author: { id: { equals: session?.itemId } } } },
                  { project: { creator: { id: { equals: session?.itemId } } } },
                ],
              },
            },
    },
  },
  fields: {
    title: text(),
    description: text(),
    dataOrigin: select({
      options: [
        { label: "study", value: "STUDY" },
        { label: "simulated", value: "SIMULATED" },
        { label: "uploaded", value: "UPLOADED" },
        { label: "template", value: "TEMPLATE" },
      ],
    }),
    isPublic: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    settings: json(),
    content: json(),
    vizJournal: relationship({
      ref: "VizJournal.vizParts",
    }),
    vizChapters: relationship({
      ref: "VizChapter.vizPart",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    position: float(),
    datasources: relationship({
      ref: "Datasource.journal",
      many: true,
    }),
  },
});
