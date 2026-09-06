import { list } from "@keystone-6/core";
import {
  checkbox,
  file,
  json,
  relationship,
  select,
  text,
  timestamp,
} from "@keystone-6/core/fields";
import { permissions } from "../access";
const {
  validateJsPsychManifest,
} = require("../lib/runtime/runtimeCore");

const isAdmin = ({ session }: any) =>
  !!session && permissions.canAccessAdminUI({ session });

const isOwner = ({ session, item }: any) =>
  !!session?.itemId &&
  (isAdmin({ session }) || String(item?.authorId) === String(session.itemId));

const visibleExperiments = ({ session }: any) => {
  if (isAdmin({ session })) return true;
  if (!session?.itemId) {
    return {
      OR: [
        { privacy: { equals: "public" } },
        { privacy: { equals: "unlisted" } },
      ],
    };
  }
  return {
    OR: [
      { author: { id: { equals: session.itemId } } },
      { collaborators: { some: { id: { equals: session.itemId } } } },
      { privacy: { equals: "public" } },
      { privacy: { equals: "unlisted" } },
    ],
  };
};

export const JsPsychExperiment = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session,
      update: ({ session }) => !!session,
      delete: ({ session }) => !!session,
    },
    filter: { query: visibleExperiments },
    item: {
      create: ({ session }) => !!session,
      update: isOwner,
      delete: isOwner,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    description: text(),
    author: relationship({
      ref: "Profile.jsPsychExperiments",
      hooks: {
        resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            if (!context.session?.itemId) {
              throw new Error("Authentication is required.");
            }
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInJsPsychExperiment",
      many: true,
    }),
    archive: file({ storage: "jspsych_archives" }),
    manifest: json(),
    entryPoint: text({ validation: { isRequired: true } }),
    version: text({ validation: { isRequired: true }, defaultValue: "1" }),
    parameters: json({ defaultValue: [] }),
    docs: json(),
    published: checkbox({ defaultValue: false }),
    privacy: select({
      options: [
        { label: "Private", value: "private" },
        { label: "Unlisted", value: "unlisted" },
        { label: "Public", value: "public" },
      ],
      defaultValue: "private",
      validation: { isRequired: true },
    }),
    tasks: relationship({ ref: "Task.jsPsychExperiment", many: true }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    updatedAt: timestamp({ db: { updatedAt: true } }),
  },
  hooks: {
    async validateInput({
      operation,
      resolvedData,
      item,
      context,
      addValidationError,
    }) {
      let manifest = resolvedData.manifest;
      let entryPoint = resolvedData.entryPoint;
      if (
        operation === "update" &&
        (manifest === undefined || entryPoint === undefined)
      ) {
        const current = await context.sudo().query.JsPsychExperiment.findOne({
          where: { id: String(item.id) },
          query: "manifest entryPoint",
        });
        manifest ??= current?.manifest;
        entryPoint ??= current?.entryPoint;
      }
      try {
        validateJsPsychManifest(manifest, entryPoint);
      } catch (error: any) {
        addValidationError(error.message);
      }
    },
  },
});
