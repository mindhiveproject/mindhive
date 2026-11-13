import { list, graphql } from "@keystone-6/core";
import {
  checkbox,
  json,
  relationship,
  select,
  text,
  timestamp,
  virtual,
} from "@keystone-6/core/fields";
import { isAdmin, isSignedIn } from "../access";
const { decodeJson } = require("../lib/taskShare");

// An offer to give people their own, independent copy of a task, survey or
// block (lib/taskShare.js has the rules). The copy is made when a recipient
// accepts, so students who join the class later can still take it.
// Everything is written through the taskShare mutations, with sudo.

const inClass = (me: string) => ({
  OR: [
    { students: { some: { id: { equals: me } } } },
    { teachingTeam: { some: { id: { equals: me } } } },
    { mentors: { some: { id: { equals: me } } } },
    { creator: { id: { equals: me } } },
  ],
});

// The sender; recipients while they are in the class and the invite is open;
// and anyone who accepted it.
function visibleInvites({ session }: any) {
  const me = session?.itemId ? String(session.itemId) : "";
  if (!me) return false;
  if (isAdmin({ session })) return true;
  return {
    OR: [
      { sender: { id: { equals: me } } },
      { acceptedBy: { some: { id: { equals: me } } } },
      {
        AND: [
          { status: { equals: "active" } },
          {
            OR: [
              {
                wholeClass: { equals: true },
                class: { students: { some: { id: { equals: me } } } },
              },
              {
                recipients: { some: { id: { equals: me } } },
                class: inClass(me),
              },
            ],
          },
        ],
      },
    ],
  };
}

const adminOnly = ({ session }: any) => isAdmin({ session });

export const TaskShareInvite = list({
  access: {
    operation: {
      query: isSignedIn,
      create: adminOnly,
      update: adminOnly,
      delete: adminOnly,
    },
    filter: { query: visibleInvites },
  },
  ui: {
    listView: {
      initialColumns: ["task", "sender", "class", "wholeClass", "status"],
    },
  },
  fields: {
    sender: relationship({ ref: "Profile.taskShareInvitesSent" }),
    task: relationship({ ref: "Task.shareInvites" }),
    class: relationship({ ref: "Class.taskShareInvites" }),
    // every student of the class, including ones who join later
    wholeClass: checkbox({ defaultValue: false }),
    recipients: relationship({
      ref: "Profile.taskShareInvitesReceived",
      many: true,
    }),
    message: text(),
    status: select({
      options: [
        { label: "Active", value: "active" },
        { label: "Withdrawn", value: "withdrawn" },
      ],
      defaultValue: "active",
      validation: { isRequired: true },
      isFilterable: true,
    }),
    acceptedBy: relationship({
      ref: "Profile.taskShareInvitesAccepted",
      many: true,
    }),
    declinedBy: relationship({
      ref: "Profile.taskShareInvitesDeclined",
      many: true,
    }),
    // { [profileId]: taskId } of the copies made; read through viewerCopyId
    copies: json({ access: { read: adminOnly } }),
    // the copy the signed-in user made from this invite, if any
    viewerCopyId: virtual({
      field: graphql.field({
        type: graphql.ID,
        resolve(item: any, _args: any, context: any) {
          const me = context.session?.itemId;
          if (!me) return null;
          const copies = decodeJson(item.copies) || {};
          return copies[String(me)] || null;
        },
      }),
    }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
  },
});
