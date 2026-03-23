// schemas/Study.ts

import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";
import { isSignedIn, isAdmin, rules } from "../access";

export const Study = list({
  access: {
    operation: {
      // Only authenticated users can interact with studies
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // What items a user can see:
      // - Admins: all
      // - Others: public studies, or where they are author or collaborator
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              OR: [
                { public: { equals: true } },
                { author: { id: { equals: session?.itemId } } },
                {
                  collaborators: { some: { id: { equals: session?.itemId } } },
                },
              ],
            },
      // Who can update/delete which studies:
      // - Admins: all
      // - Others: author or collaborator (rules.canManageOwnStudies)
      update: rules.canManageOwnStudies,
      delete: rules.canManageOwnStudies,
    },
  },

  fields: {
    title: text({ validation: { isRequired: true } }),

    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            const { title } = inputData;
            if (title) {
              let slug = slugify(title, {
                remove: /[*+~.()'"!:@]/g,
                lower: true,
                strict: true,
              });
              const items = await context.query.Study.findMany({
                where: { slug: { startsWith: slug } },
                query: "id slug",
              });
              if (items.length) {
                const re = new RegExp(`${slug}-*\\d*$`);
                const slugs = items.filter((item: any) => item.slug.match(re));
                if (slugs.length) {
                  slug = `${slug}-${slugs.length}`;
                }
              }
              return slug;
            }
          } else {
            return inputData.slug;
          }
        },
      },
    }),

    description: text(),
    shortDescription: text(),

    image: relationship({
      ref: "StudyImage.study",
      ui: {
        displayMode: "cards",
        cardFields: ["image", "altText"],
        inlineCreate: { fields: ["image", "altText"] },
        inlineEdit: { fields: ["image", "altText"] },
      },
    }),

    settings: json(),
    info: json(),

    public: checkbox({ isFilterable: true }),
    featured: checkbox({ isFilterable: true }),
    submitForPublishing: checkbox({ isFilterable: true }),
    isHidden: checkbox({ isFilterable: true }),

    components: json(),
    flow: json(),
    diagram: text(),

    author: relationship({
      ref: "Profile.researcherIn",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            // Automatically set current user as author
            return { connect: { id: context.session.itemId } };
          } else {
            // Allow explicit change only if already coming from input
            return inputData.author;
          }
        },
      },
    }),

    collaborators: relationship({
      ref: "Profile.collaboratorInStudy",
      many: true,
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return inputData.collaborators;
          } else {
            return inputData.collaborators;
          }
        },
      },
    }),

    participants: relationship({
      ref: "Profile.participantIn",
      many: true,
    }),

    guests: relationship({
      ref: "Guest.participantIn",
      many: true,
    }),

    consent: relationship({
      ref: "Consent.studies",
      many: true,
    }),

    proposal: relationship({
      ref: "ProposalBoard.study",
      many: true,
    }),

    proposalMain: relationship({
      ref: "ProposalBoard.studyMain",
    }),

    descriptionInProposalCard: relationship({
      ref: "ProposalCard.studyDescription",
    }),

    classes: relationship({
      ref: "Class.studies",
      many: true,
    }),

    reviews: relationship({
      ref: "Review.study",
      many: true,
    }),

    tags: relationship({
      ref: "Tag.studies",
      many: true,
    }),

    talks: relationship({
      ref: "Talk.studies",
      many: true,
    }),

    datasets: relationship({
      ref: "Dataset.study",
      many: true,
    }),

    summaryResults: relationship({
      ref: "SummaryResult.study",
      many: true,
    }),

    specs: relationship({
      ref: "Spec.studies",
      many: true,
    }),

    vizJournals: relationship({
      ref: "VizJournal.study",
      many: true,
    }),

    datasources: relationship({
      ref: "Datasource.study",
      many: true,
    }),

    proposalCards: relationship({
      ref: "ProposalCard.studies",
      many: true,
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),

    updatedAt: timestamp(),

    status: select({
      options: [
        { label: "Working", value: "WORKING" },
        { label: "Proposal", value: "SUBMITTED_AS_PROPOSAL" },
        { label: "Ready for review", value: "READY_FOR_REVIEW" },
        { label: "In review", value: "IN_REVIEW" },
        { label: "Reviewed", value: "REVIEWED" },
        { label: "Collecting data", value: "COLLECTING_DATA" },
        {
          label: "Data collection is completed",
          value: "DATA_COLLECTION_IS_COMPLETED",
        },
      ],
      defaultValue: "WORKING",
    }),

    currentVersion: text(),
    versionHistory: json(),
    projectName: text(),

    dataCollectionStatus: select({
      options: [
        { label: "Not started", value: "NOT_STARTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Data collection is finished", value: "FINISHED" },
      ],
      defaultValue: "NOT_STARTED",
    }),

    dataCollectionData: select({
      options: [
        { label: "Not defined", value: "NOT_DEFINED" },
        { label: "Testing", value: "TESTING" },
        { label: "Preliminary data", value: "PRELIMINARY_DATA" },
        { label: "Real data", value: "REAL_DATA" },
      ],
      defaultValue: "NOT_DEFINED",
    }),

    dataCollectionOpenForParticipation: checkbox({ isFilterable: true }),

    logs: relationship({
      ref: "Log.study",
      many: true,
    }),
  },
});
