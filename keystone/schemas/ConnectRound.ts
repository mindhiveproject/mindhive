import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  json,
} from "@keystone-6/core/fields";

export const ConnectRound = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    description: text({ ui: { displayMode: "textarea" } }),

    classNetwork: relationship({
      ref: "ClassNetwork.connectRounds",
    }),

    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Preferences Open", value: "preferences_open" },
        { label: "Preferences Closed", value: "preferences_closed" },
        { label: "Matching", value: "matching" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
    }),

    openAt: timestamp(),
    closeAt: timestamp(),
    publishedAt: timestamp(),

    matchingAlgorithm: select({
      options: [
        { label: "Stable Matching", value: "stable_matching" },
        { label: "Score-Based", value: "score_based" },
        { label: "Teacher-Curated", value: "teacher_curated" },
      ],
      defaultValue: "stable_matching",
    }),

    settings: json(),

    opportunities: relationship({
      ref: "Opportunity.rounds",
      many: true,
    }),

    questions: relationship({
      ref: "ConnectQuestion.rounds",
      many: true,
    }),

    questionAnswers: relationship({
      ref: "QuestionAnswer.round",
      many: true,
    }),

    preferences: relationship({
      ref: "ConnectPreference.round",
      many: true,
    }),

    teamPreferences: relationship({
      ref: "ConnectTeamPreference.round",
      many: true,
    }),

    matches: relationship({
      ref: "ConnectMatch.round",
      many: true,
    }),

    createdBy: relationship({
      ref: "Profile.connectRoundsCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    // Reviewers: Profiles the round creator has invited to oversee
    // opportunities submitted to this round. Per-round assignment (no
    // global REVIEWER permission). Reviewers can read opportunities in
    // the round, change their status, and leave OpportunityReviewNote
    // records — they cannot edit opportunity content (that stays with
    // the mentor).
    reviewers: relationship({
      ref: "Profile.connectRoundsReviewing",
      many: true,
    }),

    reviewNotes: relationship({
      ref: "OpportunityReviewNote.round",
      many: true,
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
