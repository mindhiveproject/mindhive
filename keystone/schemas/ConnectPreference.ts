import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const ConnectPreference = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectOwnerOrRoundCreator,
      update: rules.connectOwnerOrRoundCreator,
      delete: rules.connectOwnerOrRoundCreator,
    },
  },
  fields: {
    round: relationship({
      ref: "ConnectRound.preferences",
    }),

    submitter: relationship({
      ref: "Profile.connectPreferences",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.submitter) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.submitter;
        },
      },
    }),

    role: select({
      options: [
        { label: "Student", value: "student" },
        { label: "Mentor", value: "mentor" },
      ],
      defaultValue: "student",
    }),

    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Submitted", value: "submitted" },
      ],
      defaultValue: "draft",
    }),

    notes: text({ ui: { displayMode: "textarea" } }),

    items: relationship({
      ref: "ConnectPreferenceItem.preference",
      many: true,
    }),

    submittedAt: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
