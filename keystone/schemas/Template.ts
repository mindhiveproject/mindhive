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

export const Template = list({
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
    slug: text({
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
              const items = await context.query.Template.findMany({
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
    shortDescription: text(),
    description: text(),
    author: relationship({
      ref: "Profile.templates",
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
      ref: "Profile.collaboratorInTemplate",
      many: true,
    }),
    parameters: json(),
    fileAddress: text(),
    scriptAddress: text(),
    style: text(),
    tasks: relationship({
      ref: "Task.template",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.template",
      many: true,
    }),
    summaryResults: relationship({
      ref: "SummaryResult.template",
      many: true,
    }),
    settings: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
