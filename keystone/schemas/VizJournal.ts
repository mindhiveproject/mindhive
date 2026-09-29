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

import { signedInWrites } from "../access";

export const VizJournal = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
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
