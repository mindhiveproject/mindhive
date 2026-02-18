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


// Will have to modify to new profile fields
function getVisualFilterQuery(session: any) {
  if (session?.data.permissions?.canAccessAdminUI) return true;
  return {
    OR: [
      // You're the author
      { author: { id: { equals: session?.itemId } } },
      // Public visuals
      { privacy: { equals: "public" } },
      // You have liked & they are unlisted or for friends
      {
        AND: [
          { likes: { some: { id: { equals: session?.itemId } } } },
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
                      requester: { id: { equals: session?.itemId } },
                      status: { equals: "accepted" },
                    },
                  },
                },
              },
              {
                author: {
                  following: {
                    some: {
                      recipient: { id: { equals: session?.itemId } },
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
      update: ({ session, item }) =>
        item.authorId === session?.itemId || session?.data.isAdmin,
      create: ({ session }) => !!session,
      delete: ({ session, item }) =>
        item.authorId === session?.itemId || session?.data.isAdmin,
    },
    filter: {
      query: ({ session }) => getVisualFilterQuery(session),
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    cover: image({ storage: "cover_images" }),
    code: file({ storage: "p5_visuals" }),
    description: text(),
    author: relationship({ ref: "Profile.visuals", many: false }),
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
    likes: relationship({ ref: "Profile.liked", many: true }),
    extensions: json({ defaultValue: [] }),
    docs: json(),
    docsVisible: checkbox(),
    published: checkbox(),
    tags: relationship({ ref: "YQTag.visuals", many: true }),
    privacy: select({
      options: [
        { label: "Friends", value: "friends" },
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
        { label: "Unlisted", value: "unlisted" },
      ],
      defaultValue: "private",
    }),
    yqGenAI: relationship({ ref: "YQGenAI.visual", many: false }),
  },
});
