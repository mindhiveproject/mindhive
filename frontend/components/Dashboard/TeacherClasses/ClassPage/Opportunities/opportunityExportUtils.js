/** Column groups and CSV helpers for teacher matching-round opportunity export. */

import { getProposalAnswer } from "../../../../../lib/opportunityProposalData";
import {
  collectMediaAssetIdsFromOpportunities,
  collectOpportunityMediaDownloads,
  getOpportunityMediaCsvFields,
  mergeOpportunityMedia,
  slugifyForFilename,
} from "../../../../../lib/opportunityExportMedia";

export const EXPORT_COLUMN_GROUPS = [
  {
    id: "basics",
    labelKey: "opportunities.matchingRound.export.groups.basics",
    labelDefault: "Basics",
    columns: [
      {
        id: "id",
        headerKey: "opportunities.matchingRound.export.columns.id",
        headerDefault: "Opportunity ID",
      },
      {
        id: "title",
        headerKey: "opportunities.matchingRound.export.columns.title",
        headerDefault: "Title",
      },
      {
        id: "shortDescription",
        headerKey: "opportunities.matchingRound.export.columns.shortDescription",
        headerDefault: "Short description",
      },
      {
        id: "status",
        headerKey: "opportunities.matchingRound.export.columns.status",
        headerDefault: "Status",
      },
      {
        id: "selectedForRound",
        headerKey: "opportunities.matchingRound.export.columns.selectedForRound",
        headerDefault: "Selected for this round",
      },
    ],
  },
  {
    id: "capacity",
    labelKey: "opportunities.matchingRound.export.groups.capacity",
    labelDefault: "Capacity & availability",
    columns: [
      {
        id: "studentCapacity",
        headerKey: "opportunities.matchingRound.export.columns.studentCapacity",
        headerDefault: "Student capacity",
      },
      {
        id: "teamSize",
        headerKey: "opportunities.matchingRound.export.columns.teamSize",
        headerDefault: "Team size",
      },
      {
        id: "availableFrom",
        headerKey: "opportunities.matchingRound.export.columns.availableFrom",
        headerDefault: "Available from",
      },
      {
        id: "availableTo",
        headerKey: "opportunities.matchingRound.export.columns.availableTo",
        headerDefault: "Available to",
      },
      {
        id: "timeCommitment",
        headerKey: "opportunities.matchingRound.export.columns.timeCommitment",
        headerDefault: "Time commitment",
      },
      {
        id: "requestsAppointment",
        headerKey:
          "opportunities.matchingRound.export.columns.requestsAppointment",
        headerDefault: "Requests appointment",
      },
    ],
  },
  {
    id: "media",
    labelKey: "opportunities.matchingRound.export.groups.media",
    labelDefault: "Media",
    columns: [
      {
        id: "hasIntroVideo",
        headerKey: "opportunities.matchingRound.export.columns.hasIntroVideo",
        headerDefault: "Has intro video",
      },
      {
        id: "introVideoFilename",
        headerKey:
          "opportunities.matchingRound.export.columns.introVideoFilename",
        headerDefault: "Intro video filename",
      },
      {
        id: "introVideoUrl",
        headerKey: "opportunities.matchingRound.export.columns.introVideoUrl",
        headerDefault: "Intro video URL",
      },
      {
        id: "introVideoZipPath",
        headerKey:
          "opportunities.matchingRound.export.columns.introVideoZipPath",
        headerDefault: "Intro video zip path",
      },
      {
        id: "hasCoverImage",
        headerKey: "opportunities.matchingRound.export.columns.hasCoverImage",
        headerDefault: "Has illustration",
      },
      {
        id: "coverImageFilename",
        headerKey:
          "opportunities.matchingRound.export.columns.coverImageFilename",
        headerDefault: "Illustration filename",
      },
      {
        id: "coverImageZipPath",
        headerKey:
          "opportunities.matchingRound.export.columns.coverImageZipPath",
        headerDefault: "Illustration zip path",
      },
      {
        id: "followUpAssetCount",
        headerKey:
          "opportunities.matchingRound.export.columns.followUpAssetCount",
        headerDefault: "Follow-up asset count",
      },
      {
        id: "followUpAssetZipPaths",
        headerKey:
          "opportunities.matchingRound.export.columns.followUpAssetZipPaths",
        headerDefault: "Follow-up asset zip paths",
      },
    ],
  },
  {
    id: "people",
    labelKey: "opportunities.matchingRound.export.groups.people",
    labelDefault: "People & org",
    columns: [
      {
        id: "mentorId",
        headerKey: "opportunities.matchingRound.export.columns.mentorId",
        headerDefault: "Mentor ID",
      },
      {
        id: "mentorFirstName",
        headerKey: "opportunities.matchingRound.export.columns.mentorFirstName",
        headerDefault: "Mentor first name",
      },
      {
        id: "mentorLastName",
        headerKey: "opportunities.matchingRound.export.columns.mentorLastName",
        headerDefault: "Mentor last name",
      },
      {
        id: "mentorUsername",
        headerKey: "opportunities.matchingRound.export.columns.mentorUsername",
        headerDefault: "Mentor username",
      },
      {
        id: "mentorEmail",
        headerKey: "opportunities.matchingRound.export.columns.mentorEmail",
        headerDefault: "Mentor email",
      },
      {
        id: "organizationId",
        headerKey: "opportunities.matchingRound.export.columns.organizationId",
        headerDefault: "Organization ID",
      },
      {
        id: "organizationName",
        headerKey: "opportunities.matchingRound.export.columns.organizationName",
        headerDefault: "Organization name",
      },
    ],
  },
  {
    id: "proposal",
    labelKey: "opportunities.matchingRound.export.groups.proposal",
    labelDefault: "Proposal",
    columns: [
      {
        id: "description",
        headerKey: "opportunities.matchingRound.export.columns.description",
        headerDefault: "Description",
      },
      {
        id: "projectCategory",
        headerKey: "opportunities.matchingRound.export.columns.projectCategory",
        headerDefault: "Project category",
      },
      {
        id: "projectCategoryOther",
        headerKey:
          "opportunities.matchingRound.export.columns.projectCategoryOther",
        headerDefault: "Project category (other)",
      },
      {
        id: "relevance",
        headerKey: "opportunities.matchingRound.export.columns.relevance",
        headerDefault: "Relevance",
      },
      {
        id: "requiresSpecialResources",
        headerKey:
          "opportunities.matchingRound.export.columns.requiresSpecialResources",
        headerDefault: "Requires special resources",
      },
      {
        id: "specialResourcesNotes",
        headerKey:
          "opportunities.matchingRound.export.columns.specialResourcesNotes",
        headerDefault: "Special resources notes",
      },
      {
        id: "datasetProvision",
        headerKey: "opportunities.matchingRound.export.columns.datasetProvision",
        headerDefault: "Dataset provision",
      },
      {
        id: "datasetProvisionOther",
        headerKey:
          "opportunities.matchingRound.export.columns.datasetProvisionOther",
        headerDefault: "Dataset provision (other)",
      },
      {
        id: "expectedDeliverables",
        headerKey:
          "opportunities.matchingRound.export.columns.expectedDeliverables",
        headerDefault: "Expected deliverables",
      },
      {
        id: "expectedDeliverablesOther",
        headerKey:
          "opportunities.matchingRound.export.columns.expectedDeliverablesOther",
        headerDefault: "Expected deliverables (other)",
      },
      {
        id: "anticipatedObstacles",
        headerKey:
          "opportunities.matchingRound.export.columns.anticipatedObstacles",
        headerDefault: "Anticipated obstacles",
      },
      {
        id: "fieldResearchRequired",
        headerKey:
          "opportunities.matchingRound.export.columns.fieldResearchRequired",
        headerDefault: "Field research required",
      },
      {
        id: "fieldResearchTravelDetails",
        headerKey:
          "opportunities.matchingRound.export.columns.fieldResearchTravelDetails",
        headerDefault: "Field research travel details",
      },
      {
        id: "requiredSoftware",
        headerKey: "opportunities.matchingRound.export.columns.requiredSoftware",
        headerDefault: "Required software",
      },
      {
        id: "requiredSoftwareOther",
        headerKey:
          "opportunities.matchingRound.export.columns.requiredSoftwareOther",
        headerDefault: "Required software (other)",
      },
      {
        id: "requiredHardware",
        headerKey: "opportunities.matchingRound.export.columns.requiredHardware",
        headerDefault: "Required hardware",
      },
      {
        id: "requiredHardwareOther",
        headerKey:
          "opportunities.matchingRound.export.columns.requiredHardwareOther",
        headerDefault: "Required hardware (other)",
      },
      {
        id: "additionalNotes",
        headerKey: "opportunities.matchingRound.export.columns.additionalNotes",
        headerDefault: "Additional notes",
      },
      {
        id: "internshipInterest",
        headerKey:
          "opportunities.matchingRound.export.columns.internshipInterest",
        headerDefault: "Internship interest",
      },
    ],
  },
  {
    id: "workflow",
    labelKey: "opportunities.matchingRound.export.groups.workflow",
    labelDefault: "Workflow / audit",
    columns: [
      {
        id: "createdAt",
        headerKey: "opportunities.matchingRound.export.columns.createdAt",
        headerDefault: "Created at",
      },
      {
        id: "updatedAt",
        headerKey: "opportunities.matchingRound.export.columns.updatedAt",
        headerDefault: "Updated at",
      },
      {
        id: "guidelinesAcknowledged",
        headerKey:
          "opportunities.matchingRound.export.columns.guidelinesAcknowledged",
        headerDefault: "Guidelines acknowledged",
      },
      {
        id: "guidelinesAcknowledgedAt",
        headerKey:
          "opportunities.matchingRound.export.columns.guidelinesAcknowledgedAt",
        headerDefault: "Guidelines acknowledged at",
      },
      {
        id: "preSelectedAt",
        headerKey: "opportunities.matchingRound.export.columns.preSelectedAt",
        headerDefault: "Pre-selected at",
      },
      {
        id: "acceptedAt",
        headerKey: "opportunities.matchingRound.export.columns.acceptedAt",
        headerDefault: "Accepted at",
      },
      {
        id: "reviewedBy",
        headerKey: "opportunities.matchingRound.export.columns.reviewedBy",
        headerDefault: "Reviewed by",
      },
      {
        id: "hasReviewNotes",
        headerKey: "opportunities.matchingRound.export.columns.hasReviewNotes",
        headerDefault: "Has review notes",
      },
    ],
  },
  {
    id: "postAcceptance",
    labelKey: "opportunities.matchingRound.export.groups.postAcceptance",
    labelDefault: "Post-acceptance",
    columns: [
      {
        id: "scopeDescription",
        headerKey: "opportunities.matchingRound.export.columns.scopeDescription",
        headerDefault: "Scope description",
      },
      {
        id: "potentialActivities",
        headerKey:
          "opportunities.matchingRound.export.columns.potentialActivities",
        headerDefault: "Potential activities",
      },
      {
        id: "specificSkills",
        headerKey: "opportunities.matchingRound.export.columns.specificSkills",
        headerDefault: "Specific skills",
      },
      {
        id: "issueRelevance",
        headerKey: "opportunities.matchingRound.export.columns.issueRelevance",
        headerDefault: "Issue relevance",
      },
      {
        id: "specialConsiderations",
        headerKey:
          "opportunities.matchingRound.export.columns.specialConsiderations",
        headerDefault: "Special considerations",
      },
    ],
  },
];

export const ALL_EXPORT_COLUMN_IDS = EXPORT_COLUMN_GROUPS.flatMap((group) =>
  group.columns.map((column) => column.id),
);

export function getDefaultSelectedColumnIds() {
  return [...ALL_EXPORT_COLUMN_IDS];
}

function personDisplayName(person) {
  if (!person) return "";
  const name = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person.username || "";
}

function joinList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  if (value == null) return "";
  return String(value);
}

function boolCell(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function proposalField(opportunity, key) {
  const data = getProposalAnswer(opportunity?.proposalData);
  if (!data || typeof data !== "object") return "";
  return data[key] ?? "";
}

function hasReviewNotesForRound(opportunity, roundId) {
  if (!roundId) return false;
  const notes = opportunity?.reviewNotes;
  if (!Array.isArray(notes) || notes.length === 0) return false;
  return notes.some((note) => note?.round?.id === roundId);
}

/**
 * Merge list-row + detail payload into flat CSV cell values for one opportunity.
 */
export function buildOpportunityExportValues({
  listOpportunity,
  detailOpportunity,
  selectedOpportunityIds,
  roundId,
  assetById,
}) {
  const list = listOpportunity || {};
  const detail = detailOpportunity || {};
  const mentor = detail.mentor || list.mentor || {};
  const organization = detail.organization || list.organization || {};
  const selectedSet = new Set(selectedOpportunityIds || []);
  const media = mergeOpportunityMedia(list, detail);
  const mediaFields = getOpportunityMediaCsvFields(media, assetById);

  return {
    id: list.id || detail.id || "",
    title: list.title || detail.title || "",
    shortDescription: list.shortDescription || detail.shortDescription || "",
    status: list.status || detail.status || "",
    selectedForRound: boolCell(selectedSet.has(list.id || detail.id)),
    studentCapacity: list.studentCapacity ?? detail.studentCapacity ?? "",
    teamSize: list.teamSize ?? detail.teamSize ?? "",
    availableFrom: list.availableFrom || detail.availableFrom || "",
    availableTo: list.availableTo || detail.availableTo || "",
    timeCommitment: list.timeCommitment || detail.timeCommitment || "",
    requestsAppointment: boolCell(
      list.requestsAppointment ?? detail.requestsAppointment,
    ),
    hasIntroVideo: boolCell(mediaFields.hasIntroVideo),
    introVideoFilename: mediaFields.introVideoFilename,
    introVideoUrl: mediaFields.introVideoUrl,
    introVideoZipPath: mediaFields.introVideoZipPath,
    hasCoverImage: boolCell(mediaFields.hasCoverImage),
    coverImageFilename: mediaFields.coverImageFilename,
    coverImageZipPath: mediaFields.coverImageZipPath,
    followUpAssetCount: mediaFields.followUpAssetCount ?? 0,
    followUpAssetZipPaths: mediaFields.followUpAssetZipPaths || "",
    mentorId: mentor.id || "",
    mentorFirstName: mentor.firstName || "",
    mentorLastName: mentor.lastName || "",
    mentorUsername: mentor.username || "",
    mentorEmail: mentor.email || "",
    organizationId: organization.id || "",
    organizationName: organization.name || "",
    description: detail.description || "",
    projectCategory: detail.projectCategory || "",
    projectCategoryOther: detail.projectCategoryOther || "",
    relevance: proposalField(detail, "relevance") || "",
    requiresSpecialResources:
      proposalField(detail, "requiresSpecialResources") || "",
    specialResourcesNotes: proposalField(detail, "specialResourcesNotes") || "",
    datasetProvision: joinList(proposalField(detail, "datasetProvision")),
    datasetProvisionOther:
      proposalField(detail, "datasetProvisionOther") || "",
    expectedDeliverables: joinList(
      proposalField(detail, "expectedDeliverables"),
    ),
    expectedDeliverablesOther:
      proposalField(detail, "expectedDeliverablesOther") || "",
    anticipatedObstacles: proposalField(detail, "anticipatedObstacles") || "",
    fieldResearchRequired:
      proposalField(detail, "fieldResearchRequired") || "",
    fieldResearchTravelDetails:
      proposalField(detail, "fieldResearchTravelDetails") || "",
    requiredSoftware: joinList(proposalField(detail, "requiredSoftware")),
    requiredSoftwareOther:
      proposalField(detail, "requiredSoftwareOther") || "",
    requiredHardware: joinList(proposalField(detail, "requiredHardware")),
    requiredHardwareOther:
      proposalField(detail, "requiredHardwareOther") || "",
    additionalNotes: proposalField(detail, "additionalNotes") || "",
    internshipInterest: proposalField(detail, "internshipInterest") || "",
    createdAt: list.createdAt || detail.createdAt || "",
    updatedAt: list.updatedAt || detail.updatedAt || "",
    guidelinesAcknowledged: boolCell(detail.guidelinesAcknowledged),
    guidelinesAcknowledgedAt: detail.guidelinesAcknowledgedAt || "",
    preSelectedAt: detail.preSelectedAt || "",
    acceptedAt: detail.acceptedAt || "",
    reviewedBy: personDisplayName(detail.reviewedBy),
    hasReviewNotes: boolCell(hasReviewNotesForRound(detail, roundId)),
    scopeDescription: detail.scopeDescription || "",
    potentialActivities: detail.potentialActivities || "",
    specificSkills: detail.specificSkills || "",
    issueRelevance: detail.issueRelevance || "",
    specialConsiderations: detail.specialConsiderations || "",
  };
}

export function buildExportRows({
  listOpportunities,
  detailById,
  selectedOpportunityIds,
  roundId,
  selectedColumnIds,
  t,
  assetById,
}) {
  const columnById = new Map(
    EXPORT_COLUMN_GROUPS.flatMap((group) =>
      group.columns.map((column) => [column.id, column]),
    ),
  );
  const orderedColumns = selectedColumnIds
    .map((id) => columnById.get(id))
    .filter(Boolean);

  const headers = orderedColumns.map((column) =>
    t(column.headerKey, {}, { default: column.headerDefault }),
  );

  const rows = (listOpportunities || []).map((listOpportunity) => {
    const detail = detailById?.get(listOpportunity.id) || null;
    const values = buildOpportunityExportValues({
      listOpportunity,
      detailOpportunity: detail,
      selectedOpportunityIds,
      roundId,
      assetById,
    });
    return Object.fromEntries(
      orderedColumns.map((column, index) => [
        headers[index],
        values[column.id] ?? "",
      ]),
    );
  });

  return rows;
}

export {
  collectMediaAssetIdsFromOpportunities,
  collectOpportunityMediaDownloads,
  slugifyForFilename,
};

export function buildOpportunityExportFilename({
  networkTitle,
  roundTitle,
  date = new Date(),
  extension = "csv",
}) {
  const network = slugifyForFilename(networkTitle);
  const round = slugifyForFilename(roundTitle);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const ext = String(extension || "csv").replace(/^\./, "");
  return `opportunities-${network}-${round}-${yyyy}-${mm}-${dd}.${ext}`;
}
