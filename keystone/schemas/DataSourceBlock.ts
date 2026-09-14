import { list } from "@keystone-6/core";
import {
  text,
  json,
  integer,
  checkbox,
  image,
  relationship,
  timestamp,
} from "@keystone-6/core/fields";
import { permissions } from "../access";

const isAdmin = ({ session }: any) =>
  !!session && permissions.canAccessAdminUI({ session });

// A reusable, browsable data source: a stored yq-data processing graph plus the
// declared inputs it needs and the outputs it produces. This is the catalog
// entry ("Muse Band Power", "Face Tracking" in the builder); a study or a
// visual instantiates it through a join list (StudyDataSource / VisualDataSource)
// that holds the per-use configuration.
//
// MindHive already has an unrelated `Datasource` list for Data-Tool tabular
// sources — this is a separate concept and a separate name.
export const DataSourceBlock = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.itemId,
      update: ({ session }) => !!session?.itemId,
      delete: ({ session }) => !!session?.itemId,
    },
    item: {
      // Author, any listed collaborator, or an admin may edit the block.
      update: async ({ session, item, context }) => {
        if (!session?.itemId) return false;
        if (isAdmin({ session })) return true;
        if (item.authorId === session.itemId) return true;
        const block = await context.query.DataSourceBlock.findOne({
          where: { id: String(item.id) },
          query: "collaborators { id }",
        });
        return (block?.collaborators || []).some(
          (c: { id: string }) => c.id === session.itemId
        );
      },
      // Deleting stays with the author or an admin.
      delete: ({ session, item }) =>
        !!session?.itemId &&
        item.authorId != null &&
        (isAdmin({ session }) || item.authorId === session.itemId),
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    slug: text({ isIndexed: "unique", isFilterable: true }),
    description: text(),
    // The "Requires the Muse Device" line shown on the block card.
    requirementLabel: text(),
    cover: image({ storage: "cover_images" }),

    // null author = a built-in block shipped by MindHive.
    author: relationship({ ref: "Profile.authoredDataSourceBlocks" }),
    collaborators: relationship({
      ref: "Profile.collaboratorInDataSourceBlock",
      many: true,
    }),
    favoritedBy: relationship({
      ref: "Profile.favoriteDataSourceBlocks",
      many: true,
    }),
    isOfficial: checkbox({ defaultValue: false, isFilterable: true }),
    published: checkbox({ defaultValue: false, isFilterable: true }),

    // Declared device slots the catalog UI turns into Connect rows:
    //   [{ id, receiver, label, required }]
    // `receiver` names a yq-data BaseReceiver implementation
    // ("muse" | "emotiv" | "lsl" | "video" | "audio" | "marker" | "file" | ...).
    inputs: json({ defaultValue: [] }),

    // The terminal streams the graph produces, with their channels — the output
    // chips in the builder. Mirrors yq-data StreamMetadata / ChannelInfo:
    //   [{ streamID, modality, valueType, samplingRate,
    //      channels: [{ index, label, unit }] }]
    outputs: json({ defaultValue: [] }),

    // A yq-data PipelineGraph, stored verbatim and rehydrated with
    // `new Pipeline(graph)`:
    //   { nodes: [{ id, method, parameters, receiver, stream, label }],
    //     edges: [{ from: [nodeId], to: [nodeId, port] }],
    //     record?: { nodes: [nodeId] } }
    // `record` is the passive "which outputs a session captures" selection the
    // package carries in the graph itself; only aggregates of those reach the
    // server, and the raw values are a client-side download for now.
    graph: json({ defaultValue: { nodes: [], edges: [] } }),

    // Declares the "Advanced Options" fields the study builder's data source
    // settings panel renders for an instance of this block — the block
    // author's exposed properties (window size, correlation method, etc.),
    // as opposed to the generic per-instance settings (view signal, record,
    // stream to next block) every block gets for free:
    //   [{ key, label, type: "number" | "text" | "select",
    //      unit?, options?: string[], default }]
    // A StudyDataSource stores the chosen values in its own `settings.advanced`,
    // keyed by `key`, falling back to `default` when unset.
    settingsSchema: json({ defaultValue: [] }),

    version: integer({ defaultValue: 1 }),

    studyInstances: relationship({
      ref: "StudyDataSource.block",
      many: true,
    }),

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
