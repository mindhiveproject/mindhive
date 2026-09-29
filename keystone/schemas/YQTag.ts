import { list } from "@keystone-6/core";
import {
  text,
  relationship,
} from "@keystone-6/core/fields";
import { signedInWrites } from "../access";

export const YQTag = list({
  access: {
    operation: signedInWrites,
  },
  fields: {
    label: text(),
    visuals: relationship({ ref: "Visual.tags", many: true }),
  },
});
