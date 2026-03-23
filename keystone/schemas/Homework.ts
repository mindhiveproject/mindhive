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

export const Homework = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: own homework (author)
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
      ref: "Profile.authorOfHomework",
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
    assignment: relationship({
      ref: "Assignment.homework",
    }),
    proposalCard: relationship({
      ref: "ProposalCard.homework",
    }),
    title: text({ validation: { isRequired: true } }),
    content: text(),
    placeholder: text(),
    settings: json(),
    comment: text(),
    public: checkbox({ isFilterable: true }),
    tags: relationship({
      ref: "Tag.homeworks",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
  graphql: {
    plural: "homeworks",
  },
});
