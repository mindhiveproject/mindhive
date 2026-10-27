import { list } from "@keystone-6/core";
import { checkbox, json, select, text, timestamp } from "@keystone-6/core/fields";

import { isAdmin } from "../access";

// Admins, and whoever runs the job or deletions, may read the log.
const canReadLog = ({ session }: any) =>
  isAdmin({ session } as any) ||
  (session?.data?.permissions || []).some(
    (p: any) => p?.canRunRetention || p?.canDeleteDoeData
  );

// One row per run of DOE de-identification or deletion: when, what started
// it, whether it was a dry run, and how many records it touched. Counts only,
// never names, emails or ids, so the log itself holds no personal data. DOE
// may ask for these records (de-identification policy, "Records of each run").
export const RetentionRun = list({
  access: {
    operation: {
      query: canReadLog,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
  },
  ui: {
    listView: {
      initialColumns: ["startedAt", "trigger", "scope", "dryRun", "verified"],
      initialSort: { field: "startedAt", direction: "DESC" },
    },
  },
  fields: {
    trigger: select({
      type: "string",
      options: [
        { label: "Monthly schedule", value: "SCHEDULE" },
        { label: "Run by an admin", value: "MANUAL" },
        { label: "DOE request", value: "DOE_REQUEST" },
        { label: "School stopped using MindHive", value: "SCHOOL" },
        { label: "Termination", value: "TERMINATION" },
      ],
      validation: { isRequired: true },
    }),
    // "all DOE", "school 02M475" or "one person"; never a name or id
    scope: text(),
    dryRun: checkbox({ defaultValue: true }),
    counts: json(),
    // the scope was searched again afterwards and nothing was left
    verified: checkbox({ defaultValue: false }),
    startedAt: timestamp({ defaultValue: { kind: "now" }, isIndexed: true }),
    finishedAt: timestamp(),
  },
});
