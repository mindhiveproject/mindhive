import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import { isSignedIn, isAdmin } from "../access";

export const Lesson = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: public lessons or where they are author/collaborator
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { isPublic: { equals: true } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
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
              remove: /[*+~.()'"!:@]/g,
              lower: true,
              strict: true,
            });
            const items = await context.query.Lesson.findMany({
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
        },
      },
    }),
    description: text(),
    type: text(),
    content: text(),
    settings: json(),
    author: relationship({
      ref: "Profile.authorOfLesson",
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
      ref: "Profile.collaboratorInLesson",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return inputData.collaborators;
          } else {
            return inputData.collaborators;
          }
        },
      },
    }),
    isPublic: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    parent: relationship({
      ref: "Lesson.children",
    }),
    children: relationship({
      ref: "Lesson.parent",
      many: true,
    }),
    tags: relationship({
      ref: "Tag.lessons",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
