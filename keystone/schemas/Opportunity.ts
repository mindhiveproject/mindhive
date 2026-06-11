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

    // --- CUSP capstone sponsor application fields (Q21–Q38) ---
    // Sponsor is also the day-to-day mentor (true when one user fills both
    // roles — the current MindHive default).
    sponsorIsMentor: checkbox({ defaultValue: true }),
    mentorNotes: text({ ui: { displayMode: "textarea" } }),
    researchQuestion: text({ ui: { displayMode: "textarea" } }),
    relevance: text({ ui: { displayMode: "textarea" } }),
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
    additionalNotes: text({ ui: { displayMode: "textarea" } }),
    // Q39 — guidelines acknowledgment for the audit trail.
    guidelinesAcknowledged: checkbox({ defaultValue: false }),
    guidelinesAcknowledgedAt: timestamp(),
    requestsAppointment: checkbox({ defaultValue: false }),

    // --- Special considerations (filled at proposal time) ---
    specialConsiderations: text({ ui: { displayMode: "textarea" } }),
    designedForSpecificStudents: text({ ui: { displayMode: "textarea" } }),
    anticipatedObstacles: text({ ui: { displayMode: "textarea" } }),
    requiresBusinessHours: text({ ui: { displayMode: "textarea" } }),
    privateClientDataNotes: text({ ui: { displayMode: "textarea" } }),
    fieldResearchTravelDetails: text({ ui: { displayMode: "textarea" } }),
    expectedDeliverables: text({ ui: { displayMode: "textarea" } }),

    // --- Post-acceptance details (filled after admin accepts) ---
    scopeDescription: text({ ui: { displayMode: "textarea" } }),
    issueRelevance: text({ ui: { displayMode: "textarea" } }),
    potentialActivities: text({ ui: { displayMode: "textarea" } }),
    specificSkills: text({ ui: { displayMode: "textarea" } }),

    extraDetails: json(),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
  hooks: {
    async resolveInput({ operation, inputData, resolvedData, item }) {
      // List hooks run after field hooks — must spread resolvedData so auto-set
      // fields (e.g. mentor from session) are not wiped by raw GraphQL input.
      const data = { ...resolvedData };

      // GraphQL multiselect inputs arrive as arrays; SQLite stores JSON strings.
      if (Array.isArray(data.preferGradeLevels)) {
        data.preferGradeLevels = JSON.stringify(data.preferGradeLevels);
      }
      if (Array.isArray(data.preferClassType)) {
        data.preferClassType = JSON.stringify(data.preferClassType);
      }

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
  },
});
