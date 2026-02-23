import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";

import { allowAll } from "@keystone-6/core/access";

export const YQGenAI = list({
  access: {
    operation: {
      query: () => true,
      update: () => true,
      create: () => true,
      delete: () => true,
    },
    filter: {
      query: ({ session }) => {
        if (session?.data.permissions?.canAccessAdminUI) return true;
        return {
          author: {
            id: {
              equals: session?.itemId,
            },
          },
        };
      },
    },
  },
  fields: {
    langGraphThread: text({ isIndexed: "unique" }),
    author: relationship({ ref: "Profile.yqGenAI", many: false }),
    visual: relationship({ ref: "Visual.yqGenAI", many: false }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }), // May 12, 2025
  },
});
