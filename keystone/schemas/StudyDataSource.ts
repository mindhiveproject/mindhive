import { list } from "@keystone-6/core";
import {
  text,
  json,
  integer,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";

// One DataSourceBlock instantiated into one study. The block holds the reusable
// graph and the declared inputs/outputs; this row holds everything specific to
// this study's use of it. A study may link several.
//
// Write access rides on the study builder, same as StudyVersion — study-level
// permissions are enforced upstream.
export const StudyDataSource = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    study: relationship({ ref: "Study.dataSources" }),
    block: relationship({ ref: "DataSourceBlock.studyInstances" }),
    label: text(),
    order: integer({ defaultValue: 0 }),

    // Saved per-slot input config, keyed by the block input id:
    //   { "<inputId>": { deviceId?, lslStream?, ... } }
    // The stored choice, not the live connection.
    inputBindings: json({ defaultValue: {} }),

    // Per-instance settings, edited from the study builder's data source
    // settings panel:
    //   { viewSignal?: boolean,          // participants can see the raw signal
    //     streamToNextBlock?: boolean,   // pass the aggregate on to the next block
    //     recordParticipantData?: boolean, // save the aggregate as part of the dataset
    //     excludedChannels?: string[],   // "<streamID>::<channelIndex>" pairs filtered
    //                                    // out of `block.outputs`, still processed but
    //                                    // never aggregated
    //     advanced?: { [key: string]: unknown } } // keyed by DataSourceBlock.settingsSchema[].key
    settings: json({ defaultValue: {} }),

    // Where in the study this source is active:
    //   "study"                     — the whole participation
    //   { steps: [flowNodeId, ...] } — a subset of flow steps
    // Kept here rather than as a flow node so recording scope stays a property
    // of the study, not a step.
    scope: json({ defaultValue: "study" }),

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
