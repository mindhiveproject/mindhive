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
import { rules, isSignedIn } from "../access";

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
    description: text(),
    isPublic: checkbox({ defaultValue: false, isFilterable: true }),
    settings: json({
      defaultValue: {
        type: "feedback_network",
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
