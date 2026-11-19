// Journal
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

export const VizPart = list({
  // Signed-in users only: the team of the journal's study or project, plus
  // admin-marked templates for reading. See lib/journalAccess.js.
  access: journalListAccess("VizPart"),
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
    isPublic: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isTemplate: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isFeatured: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    settings: json(),
    content: json(), // save uploaded data here
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
  hooks: {
    validateInput: journalParentGuard("VizPart"),
    async resolveInput({ operation, resolvedData }) {
      if (operation === "create" || operation === "update") {
        resolvedData.updatedAt = new Date().toISOString();
      }
      return resolvedData;
    },
  },
});
