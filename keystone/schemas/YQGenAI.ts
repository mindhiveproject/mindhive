import { list } from "@keystone-6/core";
import { text, relationship, timestamp } from "@keystone-6/core/fields";
import { Session } from "../types";
import { isSignedIn } from "../access";

export const YQGenAI = list({
  access: {
    operation: {
      query: isSignedIn,
      update: isSignedIn,
      create: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: ({ session }: { session?: Session }) => {
        if (session?.data?.permissions?.some((p) => p.canAccessAdminUI))
          return true;
        return {
          author: {
            id: {
              equals: session?.itemId,
            },
          },
        };
      },
      update: ({ session }: { session?: Session }) => {
        if (session?.data?.permissions?.some((p) => p.canAccessAdminUI))
          return true;
        return {
          author: {
            id: {
              equals: session?.itemId,
            },
          },
        };
      },
      delete: ({ session }: { session?: Session }) => {
        if (session?.data?.permissions?.some((p) => p.canAccessAdminUI))
          return true;
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
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
  },
});
