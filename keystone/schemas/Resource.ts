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

import { signedInWrites, staffClassIds } from "../access";
const { staffCanEditClassResource } = require("../lib/classResourceCopies");
import { keepHiddenLinksOnSet } from "../lib/keepHiddenLinks";
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
    query: "isCustom collaborators { id } classes { id }",
  });
  if (
    resource?.collaborators?.some(
      (collaborator: { id: string }) =>
        String(collaborator.id) === String(session.itemId)
    )
  ) {
    return true;
  }
  // A class's own copy (e.g. made when a template board was copied into the
  // class) is edited by the class's staff, like its assignments.
  if (!resource?.isCustom) return false;
  return staffCanEditClassResource(resource, await staffClassIds(context));
}

// Class creator and co-teachers (teaching team) may publish/unpublish any
// resource to their own classes, even one they don't own. Only
// publishedToClassIds may change, and only for classes they staff.
async function canTogglePublishForStaffedClasses({
  session,
  item,
  inputData,
  context,
}: {
  session?: Session;
  item: any;
  inputData: any;
  context: any;
}) {
  if (!session?.itemId) return false;
  const next = inputData?.settings;
  if (!next || typeof next !== "object") return false;
  // SQLite stores json fields as strings on the raw item.
  let prev: any = item?.settings ?? {};
  if (typeof prev === "string") {
    try {
      prev = JSON.parse(prev);
    } catch {
      prev = {};
    }
  }
  if (!prev || typeof prev !== "object") prev = {};
  const { publishedToClassIds: prevIds = [], ...prevRest } = prev;
  const { publishedToClassIds: nextIds = [], ...nextRest } = next;
  const sameRest = (a: any, b: any) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(
      (k) => JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null)
    );
  };
  if (!sameRest(prevRest, nextRest)) return false;
  const prevSet = new Set((prevIds || []).map(String));
  const nextSet = new Set((nextIds || []).map(String));
  const changed = [
    ...[...nextSet].filter((id) => !prevSet.has(id)),
    ...[...prevSet].filter((id) => !nextSet.has(id)),
  ];
  if (!changed.length) return true;
  const me = String(session.itemId);
  const staffed = await context.sudo().query.Class.count({
    where: {
      id: { in: changed },
      OR: [
        { creator: { id: { equals: me } } },
        { teachingTeam: { some: { id: { equals: me } } } },
      ],
    },
  });
  return staffed === changed.length;
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
    // Anyone may read; changes need a signed-in user.
    operation: signedInWrites,
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
      access: {
        update: async (args: any) =>
          (await canEditResourceContent(args)) ||
          (await canTogglePublishForStaffedClasses(args)),
      },
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
      // Saving with `set` keeps links the editor cannot see (lib/keepHiddenLinks).
      hooks: { resolveInput: keepHiddenLinksOnSet("Class") },
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
