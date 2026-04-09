import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import uniqid from "uniqid";
import { isSignedIn, isAdmin } from "../access";

export const Consent = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: public consents or where they are author/collaborator
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { public: { equals: true } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    code: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.authorId,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqid();
          }
        },
      },
    }),
    title: text({ validation: { isRequired: true } }),
    public: checkbox(),
    description: text(),
    organization: text(),
    info: json(),
    settings: json(),
    author: relationship({
      ref: "Profile.consentCreatorIn",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.author;
          }
        },
      },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInConsent",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return inputData.collaborators;
          } else {
            return inputData.collaborators;
          }
        },
      },
    }),
    studies: relationship({
      ref: "Study.consent",
      many: true,
    }),
    tasks: relationship({
      ref: "Task.consent",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
