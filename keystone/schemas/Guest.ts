import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  json,
} from "@keystone-6/core/fields";
import uniqid from "uniqid";
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { isSignedIn, isAdmin } from "../access";

const customConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: "-",
  length: 3,
};

export const Guest = list({
  access: {
    operation: {
      // Reading guests probably only for admins; creating via participation flow
      query: isAdmin,
      create: () => true, // allow unauthenticated guest creation via public endpoint
      update: isAdmin,
      delete: isAdmin,
    },
  },
  fields: {
    publicId: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: isAdmin,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqid();
          }
        },
      },
    }),
    publicReadableId: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: isAdmin,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqueNamesGenerator(customConfig);
          }
        },
      },
    }),
    type: select({
      options: [{ label: "Guest", value: "GUEST" }],
      defaultValue: "GUEST",
    }),
    info: json(),
    generalInfo: json(),
    studiesInfo: json(),
    consentsInfo: json(),
    tasksInfo: json(),
    guestAccountExpiry: text(),
    participantIn: relationship({
      ref: "Study.guests",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.guest",
      many: true,
    }),
    summaryResults: relationship({
      ref: "SummaryResult.guest",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
