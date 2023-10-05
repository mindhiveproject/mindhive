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

export const Tag = list({
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
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, inputData }) {
          const { title } = inputData;
          if (title) {
            let slug = slugify(title, {
              remove: /[*+~.()'"!:@]/g, // remove characters that match regex
              lower: true, // convert to lower case
              strict: true, // strip special characters except replacement
            });
            const items = await context.query.Study.findMany({
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
        },
      },
    }),
    description: text(),
    lessons: relationship({
      ref: "Lesson.tags",
      many: true,
    }),
    assignments: relationship({
      ref: "Assignment.tags",
      many: true,
    }),
    homeworks: relationship({
      ref: "Homework.tags",
      many: true,
    }),
    studies: relationship({
      ref: "Study.tags",
      many: true,
    }),
    specs: relationship({
      ref: "Spec.tags",
      many: true,
    }),
    level: integer(),
    parent: relationship({
      ref: "Tag.children",
    }),
    children: relationship({
      ref: "Tag.parent",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
