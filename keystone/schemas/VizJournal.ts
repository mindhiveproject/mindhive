// Journal wrapper
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
} from "@keystone-6/core/fields";

import {
  adminOnlyFieldAccess,
  journalListAccess,
  journalParentGuard,
} from "../access";

export const VizJournal = list({
  // Signed-in users only: the team of the journal's study or project, plus
  // admin-marked templates for reading. See lib/journalAccess.js.
  access: journalListAccess("VizJournal"),
  fields: {
    title: text(),
    description: text(),
    isPublic: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isTemplate: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
    isFeatured: checkbox({ isFilterable: true, access: adminOnlyFieldAccess }),
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
  hooks: {
    validateInput: journalParentGuard("VizJournal"),
  },
});
