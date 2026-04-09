import { list } from "@keystone-6/core";
import { text, relationship, timestamp, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const ClassNetwork = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: where they are creator
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { creator: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    title: text({ isIndexed: "unique", validation: { isRequired: true } }),
    description: text(),
    settings: json(),
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
    classes: relationship({ ref: "Class.networks", many: true }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
