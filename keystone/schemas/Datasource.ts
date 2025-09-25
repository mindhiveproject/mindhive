import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";

export const Datasource = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
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
    content: json(), // save uploaded data here
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
