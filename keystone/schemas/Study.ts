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

const canReadStudyField = ({ session }: { session?: any }) => !!session;
const canReadPublicInfo = () => true;

export const Study = list({
  access: {
    operation: {
      // Everyone (including guests) can query studies, but
      // filter.query below decides WHICH studies they see.
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Which items a user can see:
      // - Admins: all
      // - Signed‑in: public OR author OR collaborator
      // - Anonymous/guest: only public
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : session?.itemId
            ? {
                OR: [
                  { public: { equals: true } },
                  { author: { id: { equals: session.itemId } } },
                  {
                    collaborators: {
                      some: { id: { equals: session.itemId } },
                    },
                  },
                ],
              }
            : {
                public: { equals: true },
              },
      // Who can update/delete which studies:
      // - Admins: all
      // - Others: author or collaborator
      update: rules.canManageOwnStudies,
      delete: rules.canManageOwnStudies,
    },
  },

  fields: {
    // PUBLICLY READABLE FIELDS (for guests)
    title: text({
      validation: { isRequired: true },
      access: { read: canReadPublicInfo },
    }),

    slug: text({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true,
      access: { read: canReadPublicInfo },
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

    shortDescription: text({
      access: { read: canReadPublicInfo },
    }),

    image: relationship({
      ref: "StudyImage.study",
      access: { read: canReadPublicInfo },
      ui: {
        displayMode: "cards",
        cardFields: ["keystoneImage", "image", "altText"],
        inlineCreate: { fields: ["keystoneImage", "image", "altText"] },
        inlineEdit: { fields: ["keystoneImage", "image", "altText"] },
      },
    }),

    // EVERYTHING BELOW REQUIRES A SIGNED‑IN SESSION
    description: text({
      access: { read: canReadStudyField },
    }),

    settings: json({
      access: { read: canReadPublicInfo },
    }),

    info: json({
      access: { read: canReadStudyField },
    }),

    public: checkbox({
      isFilterable: true,
      access: { read: canReadStudyField },
    }),
    featured: checkbox({
      isFilterable: true,
      access: { read: canReadStudyField },
    }),
    submitForPublishing: checkbox({
      isFilterable: true,
      access: { read: canReadStudyField },
    }),
    isHidden: checkbox({
      isFilterable: true,
      access: { read: canReadStudyField },
    }),

    components: json({
      access: { read: canReadPublicInfo },
    }),
    flow: json({
      access: { read: canReadPublicInfo },
    }),
    diagram: text({
      access: { read: canReadStudyField },
    }),

    author: relationship({
      ref: "Profile.researcherIn",
      access: { read: canReadStudyField },
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.author;
          }
        },
      },
    }),

    collaborators: relationship({
      ref: "Profile.collaboratorInStudy",
      many: true,
      access: { read: canReadStudyField },
      hooks: {
        async resolveInput({ operation, inputData }) {
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
      access: { read: canReadStudyField },
    }),

    guests: relationship({
      ref: "Guest.participantIn",
      many: true,
      access: { read: canReadStudyField },
    }),

    consent: relationship({
      ref: "Consent.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    proposal: relationship({
      ref: "ProposalBoard.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    proposalMain: relationship({
      ref: "ProposalBoard.studyMain",
      access: { read: canReadStudyField },
    }),

    descriptionInProposalCard: relationship({
      ref: "ProposalCard.studyDescription",
      access: { read: canReadStudyField },
    }),

    classes: relationship({
      ref: "Class.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    reviews: relationship({
      ref: "Review.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    tags: relationship({
      ref: "Tag.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    talks: relationship({
      ref: "Talk.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    datasets: relationship({
      ref: "Dataset.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    summaryResults: relationship({
      ref: "SummaryResult.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    specs: relationship({
      ref: "Spec.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    vizJournals: relationship({
      ref: "VizJournal.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    datasources: relationship({
      ref: "Datasource.study",
      many: true,
      access: { read: canReadStudyField },
    }),

    proposalCards: relationship({
      ref: "ProposalCard.studies",
      many: true,
      access: { read: canReadStudyField },
    }),

    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInStudies",
      many: true,
      access: { read: canReadStudyField },
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
      access: { read: canReadStudyField },
    }),

    updatedAt: timestamp({
      access: { read: canReadStudyField },
    }),

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
      access: { read: canReadStudyField },
    }),

    currentVersion: text({
      access: { read: canReadPublicInfo },
    }),
    versionHistory: json({
      access: { read: canReadStudyField },
    }),
    projectName: text({
      access: { read: canReadStudyField },
    }),

    dataCollectionStatus: select({
      options: [
        { label: "Not started", value: "NOT_STARTED" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Submitted", value: "SUBMITTED" },
        {
          label: "Data collection is finished",
          value: "FINISHED",
        },
      ],
      defaultValue: "NOT_STARTED",
      access: { read: canReadStudyField },
    }),

    dataCollectionData: select({
      options: [
        { label: "Not defined", value: "NOT_DEFINED" },
        { label: "Testing", value: "TESTING" },
        { label: "Preliminary data", value: "PRELIMINARY_DATA" },
        { label: "Real data", value: "REAL_DATA" },
      ],
      defaultValue: "NOT_DEFINED",
      access: { read: canReadStudyField },
    }),

    dataCollectionOpenForParticipation: checkbox({
      isFilterable: true,
      access: { read: canReadStudyField },
    }),

    logs: relationship({
      ref: "Log.study",
      many: true,
      access: { read: canReadStudyField },
    }),
  },
});
