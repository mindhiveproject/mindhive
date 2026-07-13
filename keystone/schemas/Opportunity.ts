import { list, graphql } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  checkbox,
  json,
  multiselect,
  image,
  file,
  virtual,
} from "@keystone-6/core/fields";
import { sendNotificationEmail } from "../lib/mail";

const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

function reviewerDisplayName(p: any) {
  if (!p) return "there";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    "there"
  );
}

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
    projectCategory: select({
      options: [
        { label: "Urban Health", value: "urban_health" },
        { label: "Urban Environment", value: "urban_environment" },
        { label: "Urban Infrastructure", value: "urban_infrastructure" },
        { label: "Other", value: "other" },
      ],
    }),
    projectCategoryOther: text(),
    coverImageUrl: text(),
    coverImage: image({ storage: "opportunity_covers" }),
    videoUrl: text(),
    videoFile: file({ storage: "opportunity_videos" }),

    mentor: relationship({
      ref: "Profile.opportunitiesCreated",
      hooks: {
        async resolveInput({ context, operation, resolvedData, fieldKey }) {
          const current = resolvedData[fieldKey];
          if (operation === "create") {
            if (current?.connect?.id) return current;
            if (context.session?.itemId) {
              return { connect: { id: context.session.itemId } };
            }
          }
          return current;
        },
      },
    }),

    // Sponsoring Organization. One-to-many — each Opportunity has at most one
    // org; an Org has many Opportunities. Auto-attached during opportunity
    // creation if the mentor belongs to exactly one org.
    organization: relationship({
      ref: "Organization.opportunities",
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

    favoriteByProfiles: relationship({
      ref: "Profile.favoriteOpportunities",
      many: true,
    }),

    // Notes left by round reviewers (see OpportunityReviewNote schema).
    // Scoped per-(opportunity, round) so the same opp reviewed in two
    // rounds keeps separate audit trails.
    reviewNotes: relationship({
      ref: "OpportunityReviewNote.opportunity",
      many: true,
    }),

    // Average of all public student ratings for this opportunity.
    // Null when no eligible ratings exist.
    publicRatingAverage: virtual({
      field: graphql.field({
        type: graphql.Float,
        async resolve(item, _args, context) {
          const ratings = await context.db.ConnectRating.findMany({
            where: {
              opportunity: { id: { equals: item.id } },
              isPublic: { equals: true },
            },
          });
          const valid = ratings.filter(
            (r) => typeof r.opportunityRating === "number",
          );
          if (!valid.length) return null;
          const sum = valid.reduce(
            (acc, r) => acc + (r.opportunityRating || 0),
            0,
          );
          return sum / valid.length;
        },
      }),
    }),

    // Number of public ratings (regardless of whether opportunityRating is set).
    publicRatingCount: virtual({
      field: graphql.field({
        type: graphql.Int,
        async resolve(item, _args, context) {
          return context.db.ConnectRating.count({
            where: {
              opportunity: { id: { equals: item.id } },
              isPublic: { equals: true },
            },
          });
        },
      }),
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
        // Teacher has pre-selected the proposal — sponsor completes follow-up
        // questionnaire before full acceptance.
        { label: "Pre-selected", value: "pre_selected" },
        // Teacher or admin has accepted — sponsor completes final scope.
        { label: "Accepted", value: "accepted" },
        { label: "Published", value: "published" },
        { label: "Closed", value: "closed" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
    }),
    // Stamped automatically when status transitions to "pre_selected".
    preSelectedAt: timestamp(),
    // Stamped automatically when status transitions to "accepted".
    acceptedAt: timestamp(),
    reviewedBy: relationship({
      ref: "Profile.opportunitiesReviewed",
    }),

    // Overview of Capstone Project Proposal — unified sponsor application form.
    // Shape matches frontend OpportunityProposalConfig (title/description stay
    // on top-level fields for listings and search).
    // Migration: before deploying this schema change, backfill proposalData from
    // the removed flat columns (relevance, expectedDeliverables, etc.) via a
    // one-time script; records without proposalData will show empty proposal
    // fields until re-saved or migrated.
    proposalData: json(),

    // Legacy CUSP fields (kept for existing records; no longer in the editor form)
    sponsorIsMentor: checkbox({ defaultValue: true }),
    mentorNotes: text({ ui: { displayMode: "textarea" } }),
    researchQuestion: text({ ui: { displayMode: "textarea" } }),
    dataRequirements: text({ ui: { displayMode: "textarea" } }),
    backgroundMethodology: text({ ui: { displayMode: "textarea" } }),
    dataSecurityConcerns: select({
      options: [
        { label: "Yes", value: "yes" },
        { label: "Maybe", value: "maybe" },
        { label: "No", value: "no" },
      ],
      defaultValue: "no",
    }),
    dataSecurityNotes: text({ ui: { displayMode: "textarea" } }),
    techRequirements: text({ ui: { displayMode: "textarea" } }),
    fieldWorkLikelihood: integer(),
    competencies: text({ ui: { displayMode: "textarea" } }),
    learningOutcomes: text({ ui: { displayMode: "textarea" } }),
    relevantLinks: json(),
    specialConsiderations: text({ ui: { displayMode: "textarea" } }),
    designedForSpecificStudents: text({ ui: { displayMode: "textarea" } }),
    requiresBusinessHours: text({ ui: { displayMode: "textarea" } }),
    privateClientDataNotes: text({ ui: { displayMode: "textarea" } }),

    // Guidelines acknowledgment for the audit trail.
    guidelinesAcknowledged: checkbox({ defaultValue: false }),
    guidelinesAcknowledgedAt: timestamp(),
    requestsAppointment: checkbox({ defaultValue: false }),

    // --- Post-acceptance details (filled after admin accepts) ---
    scopeDescription: text({ ui: { displayMode: "textarea" } }),
    issueRelevance: text({ ui: { displayMode: "textarea" } }),
    potentialActivities: text({ ui: { displayMode: "textarea" } }),
    specificSkills: text({ ui: { displayMode: "textarea" } }),

    extraDetails: json(),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: "now" },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "update") {
            return new Date().toISOString();
          }
          return undefined;
        },
      },
    }),
  },
  hooks: {
    async resolveInput({ operation, inputData, resolvedData, item }) {
      // List hooks run after field hooks — must spread resolvedData so auto-set
      // fields (e.g. mentor from session) are not wiped by raw GraphQL input.
      const data = { ...resolvedData };

      // Multiselect serialization is handled by Keystone's multiselect field
      // (jsonFieldTypePolyfilledForSQLite on dev SQLite). Do not JSON.stringify
      // here — on PostgreSQL that stores a string scalar in a Json column and
      // breaks GraphQL list resolution ("Expected Iterable") on read.

      if (operation !== "update" || !data.status) {
        return data;
      }
      const nextStatus = data.status;
      const prevStatus = item?.status;
      if (nextStatus === prevStatus) return data;

      if (
        nextStatus === "pre_selected" &&
        prevStatus !== "pre_selected" &&
        !item?.preSelectedAt
      ) {
        data.preSelectedAt = new Date().toISOString();
      }
      if (
        nextStatus === "accepted" &&
        prevStatus !== "accepted" &&
        !item?.acceptedAt
      ) {
        data.acceptedAt = new Date().toISOString();
      }
      return data;
    },
    // Email reviewers when an opportunity transitions to "pending_review"
    // (the sponsor submits it). Wrapped in try/catch so a flaky email
    // service can't break the mutation. The mentor is skipped — they
    // already know they just clicked submit.
    async afterOperation({ operation, item, originalItem, context }) {
      try {
        if (operation !== "update" || !item) return;
        const becamePending =
          item.status === "pending_review" &&
          originalItem?.status !== "pending_review";
        if (!becamePending) return;

        const fresh = await context.sudo().query.Opportunity.findOne({
          where: { id: String(item.id) },
          query: `
            id
            title
            mentor { id firstName lastName username }
            rounds {
              id
              title
              reviewers { id email firstName lastName username }
            }
          `,
        });
        if (!fresh) return;

        const mentorId = fresh.mentor?.id;
        const mentorName = reviewerDisplayName(fresh.mentor);
        const seen = new Set<string>();

        for (const round of fresh.rounds || []) {
          for (const reviewer of round.reviewers || []) {
            if (!reviewer?.email) continue;
            if (reviewer.id === mentorId) continue; // skip self-spam
            if (seen.has(reviewer.id)) continue;
            seen.add(reviewer.id);

            const link = `${frontendUrl()}/dashboard/connect/review?op=${fresh.id}&round=${round.id}`;
            try {
              await sendNotificationEmail(
                reviewer.email,
                `New opportunity to review: "${fresh.title}"`,
                `Hi ${reviewerDisplayName(reviewer)},\n\n` +
                  `${mentorName} just submitted "${fresh.title}" for review in the round "${round.title}". ` +
                  `Open the link below to read the proposal, leave notes, and change its status.`,
                link
              );
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(
                `Reviewer notification failed for ${reviewer.email}:`,
                e
              );
            }
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Opportunity afterOperation hook failed:", e);
      }
    },
  },
});
