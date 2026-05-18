import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  checkbox,
  float,
  json,
} from "@keystone-6/core/fields";

export const ConnectQuestion = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    prompt: text({ validation: { isRequired: true } }),
    helperText: text({ ui: { displayMode: "textarea" } }),

    questionType: select({
      options: [
        { label: "Short text", value: "short_text" },
        { label: "Long text", value: "long_text" },
        { label: "Single select", value: "single_select" },
        { label: "Multi select", value: "multi_select" },
        { label: "1-5 scale", value: "scale_1_5" },
        { label: "1-10 scale", value: "scale_1_10" },
        { label: "Yes / no", value: "yes_no" },
      ],
      defaultValue: "short_text",
    }),

    options: json(),

    scope: select({
      options: [
        { label: "Library", value: "library" },
        { label: "Round", value: "round" },
        { label: "Opportunity", value: "opportunity" },
      ],
      defaultValue: "library",
    }),

    rounds: relationship({
      ref: "ConnectRound.questions",
      many: true,
    }),
    opportunity: relationship({
      ref: "Opportunity.questions",
    }),

    proposedBy: relationship({
      ref: "Profile.questionsProposed",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.proposedBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.proposedBy;
        },
      },
    }),

    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Proposed", value: "proposed" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
    }),

    approvedBy: relationship({
      ref: "Profile.questionsApproved",
    }),
    reviewNotes: text({ ui: { displayMode: "textarea" } }),

    weight: float({ defaultValue: 1.0 }),
    matchingRules: json(),

    isRequired: checkbox({ defaultValue: false }),
    order: integer({ defaultValue: 0 }),

    answers: relationship({
      ref: "QuestionAnswer.question",
      many: true,
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
