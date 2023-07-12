import { list } from '@keystone-6/core';
import { text, timestamp } from '@keystone-6/core/fields';
// import { rules } from "../access";

export const Report = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    message: text(),
    dateCreated: timestamp({
      defaultValue: { kind: "now"},
    }),
  },
});
