import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  float,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import uniqid from "uniqid";

export const Resource = list({
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
            const items = await context.query.Resource.findMany({
              where: { slug: { startsWith: slug } },
              query: "id slug",
            });
            if (items.length) {
              const re = new RegExp(`${slug}-*\\d*$`);
              const slugs = items.filter((item) => item.slug.match(re));
              if (slugs.length) {
                slug = `${slug}-${uniqid()}`;
              }
            }
            return slug;
          }
        },
      },
    }),
    description: text(),
    content: json(),
    settings: json({
      defaultValue: {
        publishedToAssociatedClass: false,
      },
    }),
    author: relationship({
      ref: "Profile.authorOfResource",
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
      ref: "Profile.collaboratorInResource",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.collaborators;
          }
        },
      },
    }),
    isPublic: checkbox({ isFilterable: true }),
    isFeatured: checkbox({ isFilterable: true }),
    tags: relationship({
      ref: "Tag.resources",
      many: true,
    }),
    proposalCards: relationship({
      ref: "ProposalCard.resources",
      many: true,
    }),
    parent: relationship({
      ref: "Resource.children",
    }),
    children: relationship({
      ref: "Resource.parent",
      many: true,
    }),
    proposalBoard: relationship({
      ref: "ProposalBoard.resources",
      many: true,
    }),
    classes: relationship({
      ref: "Class.resources",
      many: true,
    }),
    isCustom: checkbox({ isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
