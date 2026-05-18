import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  checkbox,
  json,
  multiselect,
} from "@keystone-6/core/fields";

export const Opportunity = list({
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
    shortDescription: text(),
    description: text({ ui: { displayMode: "textarea" } }),
    coverImageUrl: text(),
    videoUrl: text(),

    mentor: relationship({
      ref: "Profile.opportunitiesCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.mentor) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.mentor;
        },
      },
    }),

    classNetworks: relationship({
      ref: "ClassNetwork.opportunities",
      many: true,
    }),
    rounds: relationship({
      ref: "ConnectRound.opportunities",
      many: true,
    }),

    questions: relationship({
      ref: "ConnectQuestion.opportunity",
      many: true,
    }),

    questionAnswers: relationship({
      ref: "QuestionAnswer.opportunity",
      many: true,
    }),

    preferenceItems: relationship({
      ref: "ConnectPreferenceItem.opportunity",
      many: true,
    }),

    teamPreferences: relationship({
      ref: "ConnectTeamPreference.opportunity",
      many: true,
    }),

    matches: relationship({
      ref: "ConnectMatch.opportunity",
      many: true,
    }),

    ratings: relationship({
      ref: "ConnectRating.opportunity",
      many: true,
    }),

    availableFrom: timestamp(),
    availableTo: timestamp(),
    timeCommitment: text(),

    studentCapacity: integer({ defaultValue: 1 }),
    teamSize: integer({ defaultValue: 1 }),
    allowsTeamPreferences: checkbox({ defaultValue: false }),

    preferGradeLevels: multiselect({
      options: [
        { label: "Middle School", value: "middle" },
        { label: "9 - 10 Grade", value: "nine" },
        { label: "11 - 12 Grade", value: "eleven" },
      ],
    }),
    preferGroupFormat: select({
      options: [
        { label: "Individual", value: "individual" },
        { label: "Team", value: "team" },
        { label: "Either", value: "either" },
      ],
      defaultValue: "either",
    }),
    preferClassType: multiselect({
      options: [
        { label: "Accelerated", value: "accelerated" },
        { label: "Non Accelerated", value: "nonAccelerated" },
        { label: "ELL", value: "ell" },
      ],
    }),

    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending Review", value: "pending_review" },
        { label: "Published", value: "published" },
        { label: "Closed", value: "closed" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
    }),

    extraDetails: json(),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
