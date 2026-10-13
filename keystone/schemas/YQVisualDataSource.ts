import { list } from "@keystone-6/core";
import {
  text,
  json,
  integer,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { Session } from "../types";
import { getVisualFilterQuery } from "./YQVisual";
import { canWriteParent } from "./YQVisualCodeFile";

// One DataSourceBlock linked into one Visual — the visual-side sibling of
// StudyDataSource. The block holds the reusable graph and the declared
// inputs/outputs; this row holds what is specific to this visual's use of it.
//
// Which parameter reads which output is *not* stored here. That lives on
// `Visual.parameters` as a `stream` mapping pointing at this row's id, next to
// every other way a parameter can get its value.
//
// Access mirrors the parent Visual, exactly as VisualCodeFile does: readable
// when the visual is, writable by its author and collaborators.
export const VisualDataSource = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }: { session?: Session }) => !!session,
      update: () => true,
      delete: () => true,
    },
    item: {
      create: ({ session, inputData, context }: any) =>
        canWriteParent(session, inputData?.visual?.connect?.id, context),
      update: ({ session, item, context }: any) =>
        canWriteParent(session, item?.visualId, context),
      delete: ({ session, item, context }: any) =>
        canWriteParent(session, item?.visualId, context),
    },
    filter: {
      query: ({ session }: { session?: Session }) => {
        const visualFilter = getVisualFilterQuery(session);
        return visualFilter === true ? true : { visual: visualFilter };
      },
    },
  },
  fields: {
    visual: relationship({ ref: "Visual.dataSources", many: false }),
    block: relationship({ ref: "DataSourceBlock.visualInstances" }),
    label: text(),
    order: integer({ defaultValue: 0 }),

    // Saved per-slot input config, keyed by the block input id — same shape as
    // StudyDataSource.inputBindings. The stored choice, not the live connection.
    inputBindings: json({ defaultValue: {} }),

    // Per-instance settings, the subset of StudyDataSource.settings that means
    // something outside a study:
    //   { excludedChannels?: string[],  // "<node>[/<stream>]::<channelIndex>" keys
    //                                   // hidden from the outputs and the mapping list
    //     advanced?: { [key: string]: unknown } } // keyed by DataSourceBlock.settingsSchema[].key
    settings: json({ defaultValue: {} }),

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
