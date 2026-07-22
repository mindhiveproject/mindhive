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

    // Reviewers: Profiles invited to oversee opportunities in this round
    // (per-round assignment; no global REVIEWER permission). On create,
    // teachers and mentors on classes linked to the round's network are
    // auto-connected (see list hooks). Reviewers can read opportunities,
    // change status, and leave OpportunityReviewNote records — not edit
    // opportunity content.
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
  hooks: {
    // When a round is created on a class network, auto-add as reviewers:
    // - teachers (class.creator) and mentors on classes linked to that network
    // - the round creator
    // Network-only sponsors are not auto-added; a sponsor is included only
    // if they are also a teacher/mentor on a linked class.
    async afterOperation({ operation, item, context }) {
      if (operation !== "create" || !item?.id) return;

      try {
        const round = await context.sudo().query.ConnectRound.findOne({
          where: { id: String(item.id) },
          query: `
            id
            createdBy { id }
            reviewers { id }
            classNetwork {
              id
              classes {
                creator { id }
                mentors { id }
              }
            }
          `,
        });

        if (!round?.classNetwork) return;

        const reviewerIds = new Set<string>();

        for (const cls of round.classNetwork.classes || []) {
          if (cls?.creator?.id) reviewerIds.add(cls.creator.id);
          for (const mentor of cls?.mentors || []) {
            if (mentor?.id) reviewerIds.add(mentor.id);
          }
        }

        if (round.createdBy?.id) reviewerIds.add(round.createdBy.id);

        for (const existing of round.reviewers || []) {
          if (existing?.id) reviewerIds.delete(existing.id);
        }

        if (reviewerIds.size === 0) return;

        await context.sudo().query.ConnectRound.updateOne({
          where: { id: String(item.id) },
          data: {
            reviewers: {
              connect: Array.from(reviewerIds).map((id) => ({ id })),
            },
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("ConnectRound auto-reviewers hook failed:", error);
      }
    },
  },
});
