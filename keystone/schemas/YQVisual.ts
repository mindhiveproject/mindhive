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

function getVisualFilterQuery(session: Session) {
  if (session?.data?.permissions?.some((p) => p.canAccessAdminUI)) return true;
  return {
    OR: [
      { author: { id: { equals: session?.itemId } } },
      { privacy: { equals: "public" } },
      { privacy: { equals: "unlisted" } },
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
      query: ({ session }: { session?: Session }) => !!session,
      update: ({ session }: { session?: Session }) => !!session,
      create: ({ session }: { session?: Session }) => !!session,
      delete: ({ session }: { session?: Session }) => !!session,
    },
    item: {
      update: ({ session, item }: { session?: Session; item: any }) =>
        !!session &&
        (item.authorId == session.itemId ||
          session.data?.permissions?.some((p) => p.canAccessAdminUI) ||
          false),
      delete: ({ session, item }: { session?: Session; item: any }) =>
        !!session &&
        (item.authorId == session.itemId ||
          session.data?.permissions?.some((p) => p.canAccessAdminUI) ||
          false),
    },
    filter: {
      query: ({ session }: { session?: Session }) =>
        getVisualFilterQuery(session!),
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
