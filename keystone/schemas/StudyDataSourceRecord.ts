import { list } from "@keystone-6/core";
import { json, relationship, select, timestamp } from "@keystone-6/core/fields";
import { permissions } from "../access";
const { researcherStudyClause } = require("../lib/runtime/resultAccess");

// Read/manage access mirrors Dataset's resultAccess/resultManageAccess, minus
// the task/asset authorship clauses that don't apply here — this record is
// study-wide, not tied to one task.
const canReadRecord = async ({ session, context }: any) => {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const id = session.itemId;
  return {
    OR: [
      { profile: { id: { equals: id } } },
      await researcherStudyClause(context, id),
    ],
  };
};

// One row per participant per study: the real-time data source aggregates
// collected across the whole participation. Written only through
// `saveStudyDataSourceRecord` (see keystone/mutations/dataSourceRecords.ts),
// which runs as the authenticated participant's own React session — unlike
// Dataset's runtime messages, this never crosses a sandboxed task iframe, so
// it doesn't need the signed runToken relay.
export const StudyDataSourceRecord = list({
  access: {
    operation: {
      query: ({ session }: any) => !!session,
      create: () => false,
      update: () => false,
      delete: ({ session }: any) => !!session,
    },
    filter: {
      query: canReadRecord,
      delete: canReadRecord,
    },
  },
  fields: {
    study: relationship({ ref: "Study.dataSourceRecords" }),
    profile: relationship({ ref: "Profile.dataSourceRecords" }),
    guest: relationship({ ref: "Guest.dataSourceRecords" }),
    type: select({
      options: [
        { label: "Guest", value: "GUEST" },
        { label: "User", value: "USER" },
      ],
    }),
    // One entry per (segment, source, step) window AggregateRecorder closed:
    //   [{ segmentId, sourceId, blockSlug, label, stepId, startedAt, endedAt,
    //      markers: [{ label, count, firstAt, lastAt }],
    //      streams: [{ streamID, modality, samplingRate,
    //        channels: [{ index, label, unit, n, mean, sd, min, max }] }] }]
    // Merged per window on every save rather than replaced (see mergeWindows
    // in keystone/mutations/dataSourceRecords.ts): the client sends one
    // recorder's full running list, and a participation spans several
    // recorders because the runner reloads the page between tasks.
    steps: json({ defaultValue: [] }),
    // The same shape, one entry per (segment, source), covering that
    // recorder's whole lifetime rather than one step. Consumers combine the
    // segments — `n`/`mean`/`sd`/`min`/`max` are enough to pool them — since
    // no single entry spans the full participation once a reload has split it.
    session: json({ defaultValue: [] }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    updatedAt: timestamp({
      hooks: {
        resolveInput({ operation }) {
          if (operation === "update") return new Date().toISOString();
          return undefined;
        },
      },
    }),
  },
});
