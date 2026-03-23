import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  select,
} from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Datasource = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: own datasources (author)
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
    title: text(),
    description: text(),
    author: relationship({
      ref: "Profile.authoredDatasources",
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
    journal: relationship({
      ref: "VizPart.datasources",
      many: true,
    }),
    study: relationship({
      ref: "Study.datasources",
    }),
    project: relationship({
      ref: "ProposalBoard.datasources",
    }),
    dataOrigin: select({
      options: [
        { label: "study", value: "STUDY" },
        { label: "simulated", value: "SIMULATED" },
        { label: "uploaded", value: "UPLOADED" },
        { label: "template", value: "TEMPLATE" },
      ],
    }),
    settings: json(),
    content: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
