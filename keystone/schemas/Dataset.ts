import { list } from "@keystone-6/core";
import { json, timestamp } from "@keystone-6/core/fields";
// import { rules } from "../access";

export const Dataset = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    data: json(),
    dateCreated: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
