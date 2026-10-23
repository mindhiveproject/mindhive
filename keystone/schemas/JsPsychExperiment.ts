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
  JSPSYCH_LOCKED_FIELDS,
  validateJsPsychManifest,
  validateParameterDefinitions,
} = require("../lib/runtime/runtimeCore");

const isAdmin = ({ session }: any) =>
  !!session && permissions.canAccessAdminUI({ session });

// Uploading and changing jsPsych assets is limited to ADMIN and TESTER (D10);
// using one in a Task is not.
const canManage = ({ session }: any) =>
  !!session && permissions.canManageRuntimeAssets({ session });

const isOwner = ({ session, item }: any) =>
  !!session?.itemId &&
  (isAdmin({ session }) || String(item?.authorId) === String(session.itemId));

// A version some Task uses is readable by anyone, as Templates are:
// participants load it through the task they run. Unused private uploads stay
// with their authors.
const usedByATask = { tasks: { some: {} } };

const visibleExperiments = ({ session }: any) => {
  if (isAdmin({ session })) return true;
  if (!session?.itemId) {
    return {
      OR: [
        { privacy: { equals: "public" } },
        { privacy: { equals: "unlisted" } },
        usedByATask,
      ],
    };
  }
  return {
    OR: [
      { author: { id: { equals: session.itemId } } },
      { collaborators: { some: { id: { equals: session.itemId } } } },
      { privacy: { equals: "public" } },
      { privacy: { equals: "unlisted" } },
      usedByATask,
    ],
  };
};

export const JsPsychExperiment = list({
  access: {
    operation: {
      query: () => true,
      create: canManage,
      update: canManage,
      delete: ({ session }) => !!session,
    },
    filter: { query: visibleExperiments },
    item: {
      create: canManage,
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
    // Rows that are versions of one experiment share a family. Each upload is
    // a new, immutable row (C2); a row created without one starts its own
    // family, keyed by its id.
    family: text({ isIndexed: true, isFilterable: true }),
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
    // A new upload into an existing family is its next version number.
    async resolveInput({ operation, resolvedData, context }) {
      if (operation === "create" && resolvedData.family) {
        const count = await context.sudo().query.JsPsychExperiment.count({
          where: { family: { equals: resolvedData.family } },
        });
        return { ...resolvedData, version: String(count + 1) };
      }
      return resolvedData;
    },
    async validateInput({
      operation,
      resolvedData,
      item,
      context,
      addValidationError,
    }) {
      // On SQLite (development) Keystone's json fields reach hooks already
      // stringified; Postgres passes the value itself.
      const decode = (value: any) => {
        if (typeof value !== "string") return value;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      };
      let manifest = decode(resolvedData.manifest);
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
        validateParameterDefinitions(decode(resolvedData.parameters));
      } catch (error: any) {
        addValidationError(error.message);
      }

      if (operation === "update") {
        const changed = JSPSYCH_LOCKED_FIELDS.filter(
          (field: string) => resolvedData[field] !== undefined
        );
        if (changed.length) {
          const uses = await context.sudo().query.Task.count({
            where: { jsPsychExperiment: { id: { equals: String(item.id) } } },
          });
          if (uses > 0) {
            addValidationError(
              `This version is used by ${uses} task(s), so ${changed.join(
                ", "
              )} can't change. Upload a new version instead.`
            );
          }
        }
      }

      if (operation === "create" && resolvedData.family) {
        const sessionId = context.session?.itemId;
        const familyWhere = { family: { equals: resolvedData.family } };
        const sudo = context.sudo().query.JsPsychExperiment;
        if (!(await sudo.count({ where: familyWhere }))) {
          addValidationError("This version's family does not exist.");
        } else if (!isAdmin({ session: context.session })) {
          const owned = await sudo.count({
            where: {
              ...familyWhere,
              OR: [
                { author: { id: { equals: sessionId } } },
                { collaborators: { some: { id: { equals: sessionId } } } },
              ],
            },
          });
          if (!owned) {
            addValidationError(
              "Only an author or collaborator of this experiment can add a version."
            );
          }
        }
      }
    },
    async afterOperation({ operation, item, context }) {
      if (operation === "create" && item && !item.family) {
        await context.sudo().db.JsPsychExperiment.updateOne({
          where: { id: String(item.id) },
          data: { family: String(item.id) },
        });
      }
    },
  },
});
