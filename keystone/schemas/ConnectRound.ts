import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  json,
} from "@keystone-6/core/fields";
import { syncNetworkClassStaffAsRoundReviewers } from "../lib/classStaff";

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

    // JSON bag. Known shape:
    // {
    //   sponsorFormsVisible?: boolean,
    //   preferenceWindowTimeZone?: IANA zone string (default America/Los_Angeles),
    //   schedule?: {
    //     introductionAt?: "YYYY-MM-DD",
    //     matchingStartAt?: "YYYY-MM-DD",
    //     matchingEndAt?: "YYYY-MM-DD",
    //     reviewStartAt?: "YYYY-MM-DD",
    //     reviewEndAt?: "YYYY-MM-DD",
    //     sponsorIntroAt?: "YYYY-MM-DD",
    //   }
    // }
    // Preference window remains openAt / closeAt (UTC instants; not duplicated here).
    settings: json(),

    opportunities: relationship({
      ref: "Opportunity.rounds",
      many: true,
    }),

    questions: relationship({
      ref: "ConnectQuestion.rounds",
      many: true,
    }),

    // Questionnaires associated with this round; sponsors of pre-selected
    // opportunities may be asked to complete these (keyed by formDefinitionId
    // on Opportunity.proposalData — shared across rounds if already answered).
    formDefinitions: relationship({
      ref: "FormDefinition.connectRounds",
      many: true,
    }),

    // Single class-scoped student competency assessment form for this round.
    studentAssessmentFormDefinition: relationship({
      ref: "FormDefinition.studentAssessmentRounds",
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
          if (
            operation === "create" &&
            !inputData.createdBy &&
            context.session?.itemId
          ) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    // Reviewers: Profiles invited to oversee opportunities in this round
    // (per-round assignment; no global REVIEWER permission). Class creator,
    // teaching team, and mentors on linked classes are auto-connected when
    // a round is created and when those associations change (see list hooks).
    // Reviewers can read opportunities, change status, and leave
    // OpportunityReviewNote records — not edit opportunity content.
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
    async resolveInput({ operation, resolvedData, context, item }) {
      // Backfill createdBy when a round was created without a session (e.g.
      // admin/sudo) and a signed-in teacher later saves it.
      if (
        context.session?.itemId &&
        (operation === "create" || operation === "update") &&
        !resolvedData.createdBy &&
        !item?.createdById
      ) {
        resolvedData.createdBy = {
          connect: { id: context.session.itemId },
        };
      }
      return resolvedData;
    },
    // When a round is created on a class network, auto-add as reviewers:
    // class creator, teaching team, mentors on linked classes, and the
    // round creator. Network-only sponsors are not auto-added.
    async afterOperation({ operation, item, context }) {
      if (operation !== "create" || !item?.id) return;

      try {
        const round = await context.sudo().query.ConnectRound.findOne({
          where: { id: String(item.id) },
          query: "id createdBy { id } classNetwork { id }",
        });
        if (!round?.classNetwork?.id) return;

        await syncNetworkClassStaffAsRoundReviewers(
          context,
          String(round.classNetwork.id)
        );

        if (round.createdBy?.id) {
          const withCreator = await context.sudo().query.ConnectRound.findOne({
            where: { id: String(item.id) },
            query: "id reviewers { id }",
          });
          const alreadyReviewer = (withCreator?.reviewers || []).some(
            (reviewer: { id?: string }) => reviewer?.id === round.createdBy.id
          );
          if (!alreadyReviewer) {
            await context.sudo().query.ConnectRound.updateOne({
              where: { id: String(item.id) },
              data: {
                reviewers: { connect: [{ id: round.createdBy.id }] },
              },
            });
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("ConnectRound auto-reviewers hook failed:", error);
      }
    },
  },
});
