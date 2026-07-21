import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { randomBytes } from "crypto";
import { isSignedIn, rules, canAdminManageNetworks } from "../access";

export const NetworkInvite = list({
  access: {
    operation: {
      query: isSignedIn,
      create: canAdminManageNetworks,
      update: canAdminManageNetworks,
      delete: canAdminManageNetworks,
    },
    filter: {
      query: rules.networkInviteVisible,
    },
  },
  fields: {
    direction: select({
      options: [
        { label: "Request", value: "request" },
        { label: "Invite", value: "invite" },
      ],
      validation: { isRequired: true },
      isFilterable: true,
    }),
    status: select({
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "pending",
      validation: { isRequired: true },
      isFilterable: true,
    }),
    classNetwork: relationship({
      ref: "ClassNetwork.networkInvites",
    }),
    // Initiator: the requester (request direction) or the inviting admin (invite).
    requestedBy: relationship({
      ref: "Profile.networkInvitesRequested",
    }),
    // Intended member profile when known (always set for requests; optional for email invites).
    profile: relationship({
      ref: "Profile.networkInvites",
    }),
    reviewedBy: relationship({
      ref: "Profile.networkInvitesReviewed",
    }),
    email: text({
      isFilterable: true,
      isIndexed: true,
      hooks: {
        resolveInput({ resolvedData }) {
          if (resolvedData.email && typeof resolvedData.email === "string") {
            return resolvedData.email.toLowerCase().trim();
          }
          return resolvedData.email;
        },
      },
    }),
    token: text({
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        resolveInput({ operation, resolvedData }) {
          if (operation === "create" && !resolvedData.token) {
            return randomBytes(32).toString("hex");
          }
          return resolvedData.token;
        },
      },
    }),
    // Unique while pending: `networkId:profile:profileId` or `networkId:email:email`.
    // Cleared on resolution so rejected/cancelled pairs can re-request.
    pendingKey: text({
      isIndexed: "unique",
      isFilterable: true,
      db: { isNullable: true },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    resolvedAt: timestamp(),
  },
});
