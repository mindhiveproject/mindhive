// Workspace
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

export const VizChapter = list({
  // Signed-in users only: the team of the journal's study or project, plus
  // admin-marked templates for reading. See lib/journalAccess.js.
  access: journalListAccess("VizChapter"),
  fields: {
    title: text(),
    description: text(),
    isPublic: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isTemplate: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isFeatured: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    settings: json(),
    content: json(),
    vizPart: relationship({
      ref: "VizPart.vizChapters",
    }),
    vizSections: relationship({
      ref: "VizSection.vizChapter",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    position: float(),
    layout: json(),
  },
  hooks: {
    validateInput: journalParentGuard("VizChapter"),
  },
});
