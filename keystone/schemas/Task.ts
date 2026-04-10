// schemas/Task.ts

import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import { isSignedIn, isAdmin, rules } from "../access";

export const Task = list({
  access: {
    operation: {
      // Only authenticated users can interact with tasks
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // What items a user can see:
      // - Admins: all
      // - Others: public tasks, or where they are author or collaborator
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { public: { equals: true } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      // Who can update/delete which tasks:
      // - Admins: all
      // - Others: author or collaborator (rules.canManageOwnTasks)
      update: rules.canManageOwnTasks,
      delete: rules.canManageOwnTasks,
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

    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            const { title } = inputData;
            if (title) {
              let slug = slugify(title, {
                remove: /[*+~.()'"!:@]/g,
                lower: true,
                strict: true,
              });
              const items = await context.query.Task.findMany({
                where: { slug: { startsWith: slug } },
                query: "id slug",
              });
              if (items.length) {
                const re = new RegExp(`${slug}-*\\d*$`);
                const slugs = items.filter((item: any) => item.slug.match(re));
                if (slugs.length) {
                  slug = `${slug}-${slugs.length}`;
                }
              }
              return slug;
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
            // Automatically set current user as author
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

    parameters: json(),

    settings: json(),

    link: text(),

    public: checkbox(),

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

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    updatedAt: timestamp(),
  },
});
