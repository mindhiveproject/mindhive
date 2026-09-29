import { list } from "@keystone-6/core";
import {
  relationship,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { signedInWrites } from "../access";
import { Session } from "../types";

// Either side of a follow may change or remove it; admins may manage all.
function ownFriendshipFilter({ session }: { session?: Session }) {
  if (!session?.itemId) return false;
  if (session.data?.permissions?.some((p: any) => p?.canManageUsers)) return true;
  const me = String(session.itemId);
  return {
    OR: [
      { requester: { id: { equals: me } } },
      { recipient: { id: { equals: me } } },
    ],
  };
}

export const Friendship = list({
  access: {
    operation: signedInWrites,
    filter: {
      update: ownFriendshipFilter,
      delete: ownFriendshipFilter,
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
