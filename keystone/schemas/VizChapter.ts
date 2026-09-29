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

import { signedInWrites } from "../access";

export const VizChapter = list({
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
});
