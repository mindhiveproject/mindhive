import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";

export const Task = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
                remove: /[*+~.()'"!:@]/g, // remove characters that match regex
                lower: true, // convert to lower case
                strict: true, // strip special characters except replacement
              });
              const items = await context.query.Task.findMany({
                where: { slug: { startsWith: slug } },
                query: "id slug",
              });
              if (items.length) {
                const re = new RegExp(`${slug}-*\\d*$`);
                const slugs = items.filter((item) => item.slug.match(re));
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
