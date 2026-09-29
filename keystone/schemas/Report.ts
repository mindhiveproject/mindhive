import { list } from '@keystone-6/core';
import { text, timestamp } from '@keystone-6/core/fields';
import { signedInWrites } from "../access";
// import { rules } from "../access";

export const Report = list({
  access: {
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
  },
  fields: {
    message: text(),
    dateCreated: timestamp({
      defaultValue: { kind: "now"},
    }),
  },
});
