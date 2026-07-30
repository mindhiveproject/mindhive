import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  json,
  checkbox,
} from "@keystone-6/core/fields";

// A snapshot of a study design, created every time the study is saved with a
// changed diagram. Snapshots are append-only: loading an older snapshot puts it
// back on the canvas, and saving it creates a new snapshot rather than
// rewriting history.
export const StudyVersion = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    study: relationship({
      ref: "Study.versions",
    }),
    name: text(),
    description: text(),
    // marked as important for the whole study, so that the versions that matter
    // stay on top of the list and are protected from deletion
    isFavorite: checkbox({ isFilterable: true, defaultValue: false }),
    // serialized react-diagrams model of the canvas
    diagram: text(),
    // study flow computed from the diagram at snapshot time
    flow: json(),
    createdBy: relationship({
      ref: "Profile.studyVersions",
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    // id of the entry this snapshot was migrated from in Study.versionHistory,
    // so that Datasets stamped with the old id still resolve to a version name
    legacyId: text({
      isIndexed: true,
      isFilterable: true,
    }),
  },
});
