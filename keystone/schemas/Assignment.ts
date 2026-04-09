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

export const Assignment = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: own assignments (author)
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
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
    author: relationship({
      ref: "Profile.authorOfAssignment",
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
    templateSource: relationship({
      ref: "Assignment",
      many: false,
    }),
    classes: relationship({
      ref: "Class.assignments",
      many: true,
    }),
    homework: relationship({
      ref: "Homework.assignment",
      many: true,
    }),
    proposalCards: relationship({
      ref: "ProposalCard.assignments",
      many: true,
    }),
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInAssignments",
      many: true,
    }),
    title: text({ validation: { isRequired: true } }),
    content: text(),
    placeholder: text(),
    settings: json(),
    public: checkbox({ isFilterable: true }),
    isTemplate: checkbox({ isFilterable: true }),
    tags: relationship({
      ref: "Tag.assignments",
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
});
