import { list } from "@keystone-6/core";
import { relationship, timestamp, select } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Friendship = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: friendships where they are requester or recipient
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { requester: { id: { equals: session?.itemId } } },
                { recipient: { id: { equals: session?.itemId } } },
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { requester: { id: { equals: session?.itemId } } },
                { recipient: { id: { equals: session?.itemId } } },
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { requester: { id: { equals: session?.itemId } } },
                { recipient: { id: { equals: session?.itemId } } },
              ],
            },
    },
  },
  fields: {
    requester: relationship({ ref: "Profile.following", many: false }),
    recipient: relationship({ ref: "Profile.followers", many: false }),
    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "pending",
    }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
  },
});
