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

export const Template = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: public templates or where they are author/collaborator
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
    i18nContent: json(),
    slug: text({
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
              const items = await context.query.Template.findMany({
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
    public: checkbox(),
  },
});
