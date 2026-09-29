import { list } from "@keystone-6/core";
import {
  relationship,
  checkbox,
  json,
  text,
  timestamp,
} from "@keystone-6/core/fields";
import { signedInWrites } from "../access";
// import { rules } from "../access";

export const Update = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    user: relationship({
      ref: "Profile.updates",
    }),
    updateArea: text(),
    link: text(),
    content: json(),
    hasOpen: checkbox({ isFilterable: true }),
    isArchived: checkbox({ defaultValue: false, isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
