// Component
import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
  float,
} from "@keystone-6/core/fields";

export const VizSection = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
    async resolveInput({ operation, resolvedData, item }) {
      // Automatically set updatedAt on create + update
      if (operation === "create" || operation === "update") {
        resolvedData.updatedAt = new Date().toISOString();
      }
      return resolvedData;
    },
  },
});
