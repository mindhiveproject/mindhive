import { list } from "@keystone-6/core";
import { json, relationship, select, text, timestamp } from "@keystone-6/core/fields";

import { permissions } from "../access";

const adminOnly = ({ session }: { session?: any }) =>
  permissions.canManageUsers({ session }) ||
  permissions.canAccessAdminUI({ session });

export const AiThread = list({
  access: {
    operation: {
      query: adminOnly,
      create: adminOnly,
      update: adminOnly,
      delete: adminOnly,
    },
  },
  fields: {
    threadId: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
    }),
    assistantId: text({
      validation: { isRequired: true },
      defaultValue: "feedback_helper",
    }),
    proposal: relationship({ ref: "ProposalBoard.aiThreads" }),
    questionNumber: text({ isFilterable: true }),
    questionName: text(),
    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Running", value: "running" },
        { label: "Complete", value: "complete" },
        { label: "Error", value: "error" },
      ],
      defaultValue: "pending",
      validation: { isRequired: true },
      isFilterable: true,
    }),
    request: json(),
    result: json(),
    error: text(),
    profile: relationship({ ref: "Profile.aiThreads" }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
