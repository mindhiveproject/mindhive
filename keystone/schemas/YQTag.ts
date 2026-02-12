import { list } from "@keystone-6/core";
import {
  text,
  relationship,
} from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

export const YQTag = list({
  access: {
    operation: allowAll,
  },
  fields: {
    label: text(),
    visuals: relationship({ ref: "Visual.tags", many: true }),
  },
});
