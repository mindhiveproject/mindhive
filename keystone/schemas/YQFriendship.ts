import { list } from "@keystone-6/core";
import {
  relationship,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";

export const Friendship = list({
  access: allowAll,
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
