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

import {
  adminOnlyFieldAccess,
  journalListAccess,
  journalParentGuard,
} from "../access";

export const VizSection = list({
  // Signed-in users only: the team of the journal's study or project, plus
  // admin-marked templates for reading. See lib/journalAccess.js.
  access: journalListAccess("VizSection"),
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
    isPublic: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isTemplate: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isFeatured: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    settings: json(),
    content: json(),
    vizChapter: relationship({
      ref: "VizChapter.vizSections",
    }),
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInVizSections",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    position: float(),
  },
  hooks: {
    validateInput: journalParentGuard("VizSection"),
    async resolveInput({ operation, resolvedData, item }) {
      // Automatically set updatedAt on create + update
      if (operation === "create" || operation === "update") {
        resolvedData.updatedAt = new Date().toISOString();
      }
      return resolvedData;
    },
  },
});
