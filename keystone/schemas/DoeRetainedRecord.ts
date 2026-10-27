import { list } from "@keystone-6/core";
import { text, timestamp } from "@keystone-6/core/fields";

import { isAdmin } from "../access";

// Records kept after a DOE account is de-identified (lib/purge/deidentify.ts).
// De-identification removes the account from its classes and from the authors
// of its projects, so nothing else ties those projects to DOE any more. This
// list remembers only that a record is DOE data (list and id, never a person
// or school), so termination can still delete it (lib/purge/purgeDoeData.ts).
export const DoeRetainedRecord = list({
  access: {
    operation: {
      query: isAdmin,
      create: () => false,
      update: () => false,
      delete: isAdmin,
    },
  },
  ui: {
    isHidden: true,
  },
  fields: {
    listKey: text({ validation: { isRequired: true }, isIndexed: true }),
    itemId: text({ validation: { isRequired: true }, isIndexed: true }),
    retainedAt: timestamp({ defaultValue: { kind: "now" } }),
  },
});
