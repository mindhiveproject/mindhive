import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";

import {
  signedInWrites,
  studyUpdateFilter,
  authorFilter,
  isAdmin,
} from "../access";
import { keepHiddenLinksOnSet } from "../lib/keepHiddenLinks";

const { isTrustedSession } = require("../lib/studyDataCollection");

const LOCKED_DATA_COLLECTION = ["SUBMITTED", "FINISHED"];

// Signed-in callers other than admins and the setStudyDataCollection mutation
// (lib/studyDataCollection.js) may not change these values. Internal writes
// without a session (seeds, scripts) pass.
function isGuardedCaller(context: any) {
  const session = context.session;
  if (!session?.itemId) return false;
  if (isTrustedSession(session)) return false;
  return !isAdmin({ session } as any);
}

export const Study = list({
  access: {
    // Anyone may read (participants need studies/tasks); changes need a
    // signed-in owner.
    operation: signedInWrites,
    filter: {
      update: studyUpdateFilter,
      delete: authorFilter,
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
                remove: /[*+~.()'"!:@]/g, // remove characters that match regex
                lower: true, // convert to lower case
                strict: true, // strip special characters except replacement
              });
              const items = await context.query.Study.findMany({
                where: { slug: { startsWith: slug } },
                query: "id slug",
              });
              if (items.length) {
                const re = new RegExp(`${slug}-*\\d*$`);
                const slugs = items.filter((item) => item.slug.match(re));
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
        cardFields: ["keystoneImage", "image", "altText"],
        inlineCreate: { fields: ["keystoneImage", "image", "altText"] },
        inlineEdit: { fields: ["keystoneImage", "image", "altText"] },
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
    // tasks: relationship to tasks,
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
      // Saving with `set` keeps links the editor cannot see (lib/keepHiddenLinks).
      hooks: { resolveInput: keepHiddenLinksOnSet("Class") },
    }),
    // messages: relationship to messages
    reviews: relationship({
      ref: "Review.study",
      many: true,
    }),
    // scripts: relationship to script
    // notebooks: relationship to notebook
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
    // Real-time data sources from the yq-data package (DataSourceBlock
    // instances). Distinct from `datasources` above, which is the Data-Tool
    // tabular list.
    dataSources: relationship({
      ref: "StudyDataSource.study",
      many: true,
    }),
    // Per-participant real-time data source aggregates collected while
    // running this study — see StudyDataSourceRecord.
    dataSourceRecords: relationship({
      ref: "StudyDataSourceRecord.study",
      many: true,
    }),
    proposalCards: relationship({
      ref: "ProposalCard.studies",
      many: true,
    }),
    mediaAssetsUsed: relationship({
      ref: "MediaAsset.usedInStudies",
      many: true,
    }),
    // Set from the class side only (Class.hiddenStudies, class staff).
    hiddenInClasses: relationship({
      ref: "Class.hiddenStudies",
      many: true,
      graphql: { omit: { create: true, update: true } },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp({
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "update") {
            return new Date().toISOString();
          }
          return undefined;
        },
      },
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
      // The self-managed label of a study, and the stamp every dataset
      // records (real vs test participants). Once a study is submitted, it
      // follows the milestone: only setStudyDataCollection changes it.
      hooks: {
        validateInput({ operation, resolvedData, item, context, addValidationError }) {
          if (operation !== "update" || resolvedData.status === undefined) return;
          if (resolvedData.status === item?.status) return;
          if (!LOCKED_DATA_COLLECTION.includes(item?.dataCollectionStatus as string)) return;
          if (isGuardedCaller(context)) {
            addValidationError(
              "This study has been submitted: its status follows its class milestone."
            );
          }
        },
      },
    }),
    // id of the StudyVersion used for data collection: it is stamped on every
    // Dataset and keys the participant data-policy consent, so it deliberately
    // does NOT move on every save (see StudyVersion for the save history)
    currentVersion: text(),
    versions: relationship({
      ref: "StudyVersion.study",
      many: true,
    }),
    // legacy: superseded by the StudyVersion list, kept for old studies that
    // have not been migrated and is no longer written to by the builder
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
      // Locks the study once submitted (frontend/lib/studyLock.js). Written
      // only by setStudyDataCollection, which also updates every linked
      // board's milestone.
      hooks: {
        validateInput({ operation, resolvedData, item, context, addValidationError }) {
          if (resolvedData.dataCollectionStatus === undefined) return;
          if (operation === "update" && resolvedData.dataCollectionStatus === item?.dataCollectionStatus) return;
          if (operation === "create" && resolvedData.dataCollectionStatus === "NOT_STARTED") return;
          if (isGuardedCaller(context)) {
            addValidationError(
              "A study's data collection is submitted, finished or reopened from its data-collection card or by a teacher."
            );
          }
        },
      },
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
    tickets: relationship({
      ref: "Ticket.study",
      many: true,
    }),
  },
});
