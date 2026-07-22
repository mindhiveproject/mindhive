import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import uniqid from "uniqid";
import { rules, isSignedIn, canAdminManageNetworks } from "../access";

export const ClassNetwork = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: rules.classNetworkMutate,
      delete: rules.classNetworkMutate,
    },
  },
  fields: {
    title: text({ isIndexed: "unique", validation: { isRequired: true } }),
    // Stable share/deep-link identifier (Profile/Guest pattern). Prefer this
    // over internal `id` in URLs. Generated on create; updates are locked.
    publicId: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => false,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqid();
          }
        },
      },
    }),
    description: text(),
    isPublic: checkbox({ defaultValue: false, isFilterable: true }),
    settings: json({
      defaultValue: {
        type: "feedback_network",
        membershipMode: "approval",
      },
    }),
    creator: relationship({
      ref: "Profile.classNetworksCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.creator;
          }
        },
      },
    }),
    admins: relationship({
      ref: "Profile.adminOfClassNetworks",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation !== "create") {
            return inputData.admins;
          }

          const creatorId = context.session?.itemId;
          if (!creatorId) {
            return inputData.admins;
          }

          const existing = inputData.admins || {};
          const existingConnect = Array.isArray(existing.connect)
            ? existing.connect
            : [];
          const hasCreator = existingConnect.some(
            (item: { id?: string }) => item?.id === creatorId
          );

          return {
            ...existing,
            connect: hasCreator
              ? existingConnect
              : [...existingConnect, { id: creatorId }],
          };
        },
      },
    }),
    classes: relationship({ ref: "Class.networks", many: true }),
    memberProfiles: relationship({
      ref: "Profile.memberOfClassNetworks",
      many: true,
      // Public GraphQL updates stay locked; Admin UI operators and sudo
      // custom mutations can change membership. Creator auto-connect still
      // works via resolveInput.
      access: {
        read: () => true,
        create: canAdminManageNetworks,
        update: canAdminManageNetworks,
      },
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation !== "create") {
            return inputData.memberProfiles;
          }

          const creatorId = context.session?.itemId;
          if (!creatorId) {
            return inputData.memberProfiles;
          }

          const existing = inputData.memberProfiles || {};
          const existingConnect = Array.isArray(existing.connect)
            ? existing.connect
            : [];
          const hasCreator = existingConnect.some(
            (item: { id?: string }) => item?.id === creatorId
          );

          return {
            ...existing,
            connect: hasCreator
              ? existingConnect
              : [...existingConnect, { id: creatorId }],
          };
        },
      },
    }),
    networkInvites: relationship({
      ref: "NetworkInvite.classNetwork",
      many: true,
    }),
    memberOrganizations: relationship({
      ref: "Organization.memberOfClassNetworks",
      many: true,
    }),
    opportunities: relationship({
      ref: "Opportunity.classNetworks",
      many: true,
    }),
    connectRounds: relationship({
      ref: "ConnectRound.classNetwork",
      many: true,
    }),
    matches: relationship({
      ref: "ConnectMatch.classNetwork",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp({
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "update") {
            return new Date().toISOString();
          }
          return undefined;
        },
      },
    }),
  },
  hooks: {
    validateInput: async ({ operation, context, addValidationError }) => {
      if (operation === "create" && !context.session?.itemId) {
        addValidationError("You must be signed in to create a class network.");
      }
    },
  },
});
