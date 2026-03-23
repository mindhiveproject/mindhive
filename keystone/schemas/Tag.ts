import { list } from "@keystone-6/core";
import { text, relationship, timestamp, select } from "@keystone-6/core/fields";
import slugify from "slugify";
import { isSignedIn, isAdmin } from "../access";

export const Tag = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
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
              const items = await context.query.Tag.findMany({
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
    lessons: relationship({
      ref: "Lesson.tags",
      many: true,
    }),
    resources: relationship({
      ref: "Resource.tags",
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
    level: select({
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
      ],
      defaultValue: "1",
    }),
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
    profiles: relationship({
      ref: "Profile.interests",
      many: true,
    }),
  },
});
