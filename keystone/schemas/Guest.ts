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
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

import { canViewGuestData, isAdmin } from "../access";

const signedIn = ({ session }: any) => !!session?.itemId;
// A request may read back the guest it just created: createGuest hands a new
// guest their code, which the join page puts in their link.
const createdInRequest = new WeakMap<object, Set<string>>();
// Denied reads resolve to null.
const guestDataRead = {
  read: ({ context, item }: any) =>
    !!createdInRequest.get(context?.req)?.has(String(item?.id)) ||
    canViewGuestData(context, item?.id),
};
const customConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: "-",
  length: 3,
};

export const Guest = list({
  access: {
    operation: {
      query: () => true,
      // Guests are anonymous participants: createGuest stays open. Later
      // writes go through updateGuestStudiesInfo (keyed by publicId, sudo),
      // so generated updates and deletes are admin-only. Reads of a guest's
      // code and details are limited field by field: other pages only count
      // a study's guests.
      create: () => true,
      update: isAdmin,
      delete: isAdmin,
    },
  },
  hooks: {
    afterOperation: ({ operation, item, context }: any) => {
      if (operation !== "create" || !context?.req) return;
      const created = createdInRequest.get(context.req) || new Set<string>();
      created.add(String(item.id));
      createdInRequest.set(context.req, created);
    },
  },
  fields: {
    publicId: text({
      isIndexed: "unique",
      isFilterable: signedIn,
      access: {
        ...guestDataRead,
        create: () => true,
        update: () => true,
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
      isFilterable: signedIn,
      access: {
        ...guestDataRead,
        create: () => true,
        update: () => true,
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
      options: [
        { label: "Guest", value: "GUEST" },
      ],
      defaultValue: "GUEST",
    }),
    info: json({ access: guestDataRead }),
    generalInfo: json({ access: guestDataRead }),
    studiesInfo: json({ access: guestDataRead }),
    consentsInfo: json({ access: guestDataRead }),
    tasksInfo: json({ access: guestDataRead }),
    guestAccountExpiry: text(),
    participantIn: relationship({
      ref: "Study.guests",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.guest",
      many: true,
    }),
    dataSourceRecords: relationship({
      ref: "StudyDataSourceRecord.guest",
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
