import { list, graphql } from "@keystone-6/core";
const { uniqueSlug } = require("../lib/uniqueSlug");
const { decodeJson } = require("../lib/taskShare");
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
  virtual,
} from "@keystone-6/core/fields";

import { signedInWrites, authorOrCollaboratorFilter, authorFilter } from "../access";

export const Task = list({
  access: {
    // Anyone may read (participants need studies/tasks); changes need a
    // signed-in owner.
    operation: signedInWrites,
    filter: {
      update: authorOrCollaboratorFilter,
      delete: authorFilter,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    i18nContent: json(),
    taskType: select({
      type: "enum",
      options: [
        { label: "Task", value: "TASK" },
        { label: "Survey", value: "SURVEY" },
        { label: "Block", value: "BLOCK" },
      ],
    }),
    runtimeType: select({
      type: "enum",
      options: [
        { label: "Lab.js", value: "LABJS" },
        { label: "p5.js", value: "P5" },
        { label: "jsPsych", value: "JSPSYCH" },
      ],
      defaultValue: "LABJS",
      validation: { isRequired: true },
    }),
    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            const { title } = inputData;
            if (title) {
              return uniqueSlug(context, "Task", title);
            }
          } else {
            return inputData.slug;
          }
        },
      },
    }),
    description: text(),
    descriptionForParticipants: text(),
    author: relationship({
      ref: "Profile.taskCreatorIn",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.author;
          }
        },
      },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInTask",
      many: true,
    }),
    favoriteBy: relationship({
      ref: "Profile.favoriteTasks",
      many: true,
    }),
    template: relationship({
      ref: "Template.tasks",
    }),
    // Set on a study's own copy of a task (made when the task is added to a
    // study, or when a block of it is edited). A task without it is an
    // original: the one shown in the task bank, which studies never edit.
    copiedFrom: relationship({
      ref: "Task",
    }),
    visual: relationship({
      ref: "Visual.tasks",
    }),
    jsPsychExperiment: relationship({
      ref: "JsPsychExperiment.tasks",
    }),
    parameters: json(),
    settings: json(),
    aggregateVariables: json(),
    link: text(),
    public: checkbox(),
    // Shown on the signed-out discover page. Independent of `public`, which
    // stays the publishing gate; signed-out visitors see public AND featured.
    featured: checkbox({ isFilterable: true }),
    submitForPublishing: checkbox(),
    isOriginal: checkbox(),
    isExternal: checkbox(),
    image: text(),
    largeImage: text(),
    consent: relationship({
      ref: "Consent.tasks",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.task",
      many: true,
    }),
    summaryResults: relationship({
      ref: "SummaryResult.task",
      many: true,
    }),
    proposalCards: relationship({
      ref: "ProposalCard.tasks",
      many: true,
    }),
    // Set from the class side only (Class.hiddenTasks, class staff), so a
    // task's authors can't change which classes hide it.
    // Offers to share this task as a copy (TaskShareInvite)
    shareInvites: relationship({
      ref: "TaskShareInvite.task",
      many: true,
      ui: { createView: { fieldMode: "hidden" } },
    }),
    // Who shared this copy, from settings.sharedFrom (lib/taskShare.js), for
    // the "Shared by" tag. Nothing is stored here.
    sharedByName: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item: any, _args: any, context: any) {
          const sharedById = decodeJson(item.settings)?.sharedFrom?.sharedById;
          if (!sharedById) return null;
          const sender = await context.sudo().db.Profile.findOne({
            where: { id: String(sharedById) },
          });
          if (!sender) return null;
          const name = [sender.firstName, sender.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          return name || sender.username || null;
        },
      }),
    }),
    hiddenInClasses: relationship({
      ref: "Class.hiddenTasks",
      many: true,
      graphql: { omit: { create: true, update: true } },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
