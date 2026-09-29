import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";

import { allowAll } from "@keystone-6/core/access";
import { Session } from "../types";

// Admin UI users see every thread; everyone else only their own. Anonymous
// callers get nothing (an `equals: undefined` filter would match every row).
function ownThreadsFilter({ session }: { session?: Session }) {
  if (session?.data?.permissions?.some((p) => p.canAccessAdminUI)) return true;
  if (!session?.itemId) return false;
  return { author: { id: { equals: session.itemId } } };
}

export const YQGenAI = list({
  access: {
    operation: {
      query: () => true,
      update: () => true,
      create: () => true,
      delete: () => true,
    },
    filter: {
      query: ownThreadsFilter,
      update: ownThreadsFilter,
      delete: ownThreadsFilter,
    },
  },
  fields: {
    langGraphThread: text({ isIndexed: "unique" }),
    author: relationship({ ref: "Profile.yqGenAI", many: false }),
    visual: relationship({ ref: "Visual.yqGenAI", many: false }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }), // May 12, 2025
  },
});
