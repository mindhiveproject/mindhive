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
import { Session } from "../types";

function isResourceOwner(session: Session | undefined, item: any) {
  if (!session?.itemId || item?.authorId == null) return false;
  return String(item.authorId) === String(session.itemId);
}

function isAdmin(session?: Session) {
  return !!session?.data?.permissions?.some((p) => p.canAccessAdminUI);
}

async function canEditResourceContent({
  session,
  item,
  context,
}: {
  session?: Session;
  item: any;
  context: any;
}) {
  if (!session?.itemId) return false;
  if (isAdmin(session) || isResourceOwner(session, item)) return true;

  const resource = await context.sudo().query.Resource.findOne({
    where: { id: String(item.id) },
    query: "collaborators { id }",
  });
  return !!resource?.collaborators?.some(
    (collaborator: { id: string }) =>
      String(collaborator.id) === String(session.itemId)
  );
}

const ownerOnlyUpdate = ({
  session,
  item,
}: {
  session?: Session;
  item: any;
}) => isAdmin(session) || isResourceOwner(session, item);

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
    title: text({
      validation: { isRequired: true },
      access: { update: canEditResourceContent },
    }),
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
    description: text({ access: { update: canEditResourceContent } }),
    content: json({ access: { update: canEditResourceContent } }),
    settings: json({
      defaultValue: {
        publishedToClassIds: [],
      },
      access: { update: canEditResourceContent },
    }),
    author: relationship({
      ref: "Profile.authorOfResource",
      access: { update: ownerOnlyUpdate },
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
      access: { update: ownerOnlyUpdate },
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
    isPublic: checkbox({
      isFilterable: true,
      access: { update: ownerOnlyUpdate },
    }),
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
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInResources",
      many: true,
    }),
    isCustom: checkbox({ isFilterable: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
  hooks: {
    resolveInput({ operation, resolvedData }) {
      if (
        operation === "update" &&
        (Object.prototype.hasOwnProperty.call(resolvedData, "title") ||
          Object.prototype.hasOwnProperty.call(resolvedData, "content"))
      ) {
        resolvedData.updatedAt = new Date().toISOString();
      } else if (operation === "update") {
        // Relationship and metadata changes (for example linking a resource to
        // a card or class) must not make the resource content look newly edited.
        delete resolvedData.updatedAt;
      }
      return resolvedData;
    },
  },
});
