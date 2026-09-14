import { list } from "@keystone-6/core";
import { json, relationship, select, timestamp } from "@keystone-6/core/fields";
import { permissions } from "../access";

// Read/manage access mirrors Dataset's resultAccess/resultManageAccess, minus
// the task/asset authorship clauses that don't apply here — this record is
// study-wide, not tied to one task.
const canReadRecord = ({ session }: any) => {
  if (!session?.itemId) return false;
  if (permissions.canManageUsers({ session })) return true;
  const id = session.itemId;
  return {
    OR: [
      { profile: { id: { equals: id } } },
      { study: { author: { id: { equals: id } } } },
      { study: { collaborators: { some: { id: { equals: id } } } } },
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
    // One entry per (source, step) window AggregateRecorder closed:
    //   [{ sourceId, blockSlug, label, stepId, startedAt, endedAt,
    //      markers: [{ label, count, firstAt, lastAt }],
    //      streams: [{ streamID, modality, samplingRate,
    //        channels: [{ index, label, unit, n, mean, sd, min, max }] }] }]
    // Replaced wholesale on every save — the client always sends the
    // recorder's full running list, not a delta.
    steps: json({ defaultValue: [] }),
    // The same shape, one entry per source, for the whole participation
    // rather than one step. Updated as the session progresses so a save
    // mid-study is never a total loss if the participant leaves early.
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
