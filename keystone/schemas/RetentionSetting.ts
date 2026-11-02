import { list } from "@keystone-6/core";
import { checkbox, text, timestamp } from "@keystone-6/core/fields";

import { isAdmin } from "../access";

// Switches for the DOE data agreement's monthly job, one row (key "default"),
// read and changed through mutations/retentionSettings.ts.
//
// autoDeidentify is off by default: the scheduled run then only previews and
// logs what it would do, and an admin approves each run from the DOE data
// page. Turned on, the scheduled run warns and de-identifies by itself.
export const RetentionSetting = list({
  access: {
    operation: {
      query: isAdmin,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
  },
  ui: { isHidden: true },
  fields: {
    key: text({ isIndexed: "unique", validation: { isRequired: true } }),
    autoDeidentify: checkbox({ defaultValue: false }),
    updatedAt: timestamp(),
    // username of whoever last changed a switch
    updatedBy: text(),
  },
});
