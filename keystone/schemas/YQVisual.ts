import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  json,
  file,
  image,
} from "@keystone-6/core/fields";
import { Session } from "../types";

// ── Who is who on a Visual ───────────────────────────────────────────────────
//
// Three roles matter here:
//   owner        – the author, or a YQ admin. Full control, including the
//                  fields that hand out access (author/collaborators/privacy).
//   collaborator – invited through the share menu. May edit the *content* of
//                  the visual (code, docs, parameters, extensions, cover…) but
//                  may not re-share it, rename it, change its privacy, or
//                  delete it.
//   everyone else – read-only, plus toggling their own like.

function isAdmin(session?: Session) {
  return !!session?.data?.permissions?.some((p) => p.canAccessAdminUI);
}

function isOwner(session: Session | undefined, item: any) {
  if (isAdmin(session)) return true;
  if (!session?.itemId || item?.authorId == null) return false;
  return String(item.authorId) === String(session.itemId);
}

async function isCollaborator(
  session: Session | undefined,
  item: any,
  context: any
) {
  if (!session?.itemId || !item?.id) return false;
  // `item` is the raw database row, so the many-to-many collaborators are not
  // on it — read them with sudo so this check doesn't recurse through the
  // Visual filter below.
  const visual = await context.sudo().query.Visual.findOne({
    where: { id: String(item.id) },
    query: "collaborators { id }",
  });
  return !!visual?.collaborators?.some(
    (collaborator: { id: string }) =>
      String(collaborator.id) === String(session.itemId)
  );
}

/**
 * Liking is an `updateVisual`, so every signed-in viewer needs to get past item
 * access to do it. Allow that narrow case only: `likes` must be the one field
 * being written, and the only profile connected/disconnected must be the
 * caller's own.
 */
function isOwnLikeToggle(inputData: any, session?: Session) {
  if (!session?.itemId) return false;

  const keys = Object.keys(inputData ?? {});
  if (keys.length !== 1 || keys[0] !== "likes") return false;

  const likes = inputData.likes ?? {};
  // `set`/`create` could wipe or forge the whole list — only the additive and
  // subtractive forms are safe to allow.
  if (likes.set || likes.create) return false;

  const touched = [...(likes.connect ?? []), ...(likes.disconnect ?? [])];
  if (touched.length === 0) return false;
  return touched.every(
    (profile: { id?: string }) => String(profile?.id) === String(session.itemId)
  );
}

/** Fields only the author (or an admin) may write once the visual exists. */
const ownerOnlyUpdate = ({ session, item }: { session?: Session; item: any }) =>
  isOwner(session, item);

// Will have to modify to new profile fields
function getVisualFilterQuery(session?: Session) {
  if (isAdmin(session)) return true;

  // Every clause below keys off the caller's id. Without a session that becomes
  // `equals: undefined`, which Prisma reads as "no constraint" and silently
  // widens the filter — so answer anonymous callers explicitly instead.
  if (!session?.itemId) {
    return {
      OR: [
        { privacy: { equals: "public" } },
        { privacy: { equals: "unlisted" } },
      ],
    };
  }

  return {
    OR: [
      // You're the author
      { author: { id: { equals: session.itemId } } },
      // You've been invited to edit it — collaborators can always reach the
      // visual, whatever its privacy setting.
      { collaborators: { some: { id: { equals: session.itemId } } } },
      // Public visuals
      { privacy: { equals: "public" } },
      // Unlisted visuals
      { privacy: { equals: "unlisted" } },
      // You have liked & they are unlisted or for friends
      {
        AND: [
          { likes: { some: { id: { equals: session.itemId } } } },
          {
            OR: [
              { privacy: { equals: "unlisted" } },
              { privacy: { equals: "friends" } },
            ],
          },
        ],
      },
      // Made by a friend and with "friends" privacy
      {
        AND: [
          {
            OR: [
              {
                author: {
                  followers: {
                    some: {
                      requester: { id: { equals: session.itemId } },
                      status: { equals: "accepted" },
                    },
                  },
                },
              },
              {
                author: {
                  following: {
                    some: {
                      recipient: { id: { equals: session.itemId } },
                      status: { equals: "accepted" },
                    },
                  },
                },
              },
            ],
          },
          { privacy: { equals: "friends" } },
        ],
      },
    ],
  };
}

export const Visual = list({
  access: {
    operation: {
      query: () => true,
      update: () => true,
      create: () => true,
      delete: () => true,
    },
    item: {
      update: async ({
        session,
        item,
        inputData,
        context,
      }: {
        session?: Session;
        item: any;
        inputData: any;
        context: any;
      }) => {
        if (!session) return false;
        if (isOwner(session, item)) return true;
        if (isOwnLikeToggle(inputData, session)) return true;
        // Collaborators get through here; the per-field rules below are what
        // stop them touching author/collaborators/privacy/title.
        return isCollaborator(session, item, context);
      },
      create: ({ session }: { session?: Session }) => !!session,
      // Deleting stays with the author — a collaborator losing their temper
      // shouldn't be able to destroy someone else's work.
      delete: ({ session, item }: { session?: Session; item: any }) =>
        isOwner(session, item),
    },
    filter: {
      query: ({ session }) => getVisualFilterQuery(session),
    },
  },
  fields: {
    title: text({
      validation: { isRequired: true },
      access: { update: ownerOnlyUpdate },
    }),
    cover: image({ storage: "cover_images" }),
    code: file({ storage: "p5_visuals" }),
    description: text(),
    author: relationship({
      ref: "Profile.visuals",
      many: false,
      access: { update: ownerOnlyUpdate },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInVisual",
      many: true,
      access: { update: ownerOnlyUpdate },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    parameters: json({
      defaultValue: [
        {
          name: "Sample",
          suggested: ["Alpha"],
        },
      ],
    }),
    version: text({ defaultValue: "1" }),
    tasks: relationship({ ref: "Task.visual", many: true }),
    likes: relationship({ ref: "Profile.liked", many: true }),
    extensions: json({ defaultValue: [] }),
    docs: json(),
    docsVisible: checkbox(),
    published: checkbox({ access: { update: ownerOnlyUpdate } }),
    lastTimeEdited: timestamp(),
    yjsState: text({
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        listView: { fieldMode: "hidden" },
      },
    }),
    isEditedBy: relationship({ ref: "Profile.editsVisual" }),
    tags: relationship({ ref: "YQTag.visuals", many: true }),
    privacy: select({
      options: [
        { label: "Friends", value: "friends" },
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
        { label: "Unlisted", value: "unlisted" },
      ],
      defaultValue: "private",
      access: { update: ownerOnlyUpdate },
    }),
    yqGenAI: relationship({ ref: "YQGenAI.visual", many: false }),
  },
});
