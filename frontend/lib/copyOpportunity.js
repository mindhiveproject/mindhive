import { getIntakeProposalFormDefinitionId } from "./opportunityProposalData";

const INTAKE_SCALAR_FIELDS = [
  "shortDescription",
  "description",
  "projectCategory",
  "projectCategoryOther",
  "coverImageUrl",
  "videoUrl",
  "availableFrom",
  "availableTo",
  "timeCommitment",
  "studentCapacity",
  "teamSize",
  "allowsTeamPreferences",
  "preferGradeLevels",
  "preferGroupFormat",
  "preferClassType",
  "sponsorIsMentor",
  "mentorNotes",
  "extraDetails",
  "issueRelevance",
  "specialConsiderations",
  "guidelinesAcknowledged",
  "requestsAppointment",
  "scopeDescription",
  "potentialActivities",
  "specificSkills",
];

async function fetchFileAsUpload(url, filename) {
  if (!url || typeof url !== "string") return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const name =
      (typeof filename === "string" && filename.trim()) ||
      url.split("/").pop()?.split("?")[0] ||
      "file";
    return new File([blob], name, {
      type: blob.type || "application/octet-stream",
    });
  } catch {
    return null;
  }
}

function buildIntakeProposalData(source, excludeFormDefinitionIds = []) {
  const exclude = new Set(
    Array.from(excludeFormDefinitionIds || []).filter(Boolean),
  );
  const intakeFormId = getIntakeProposalFormDefinitionId(
    source?.proposalData,
    exclude,
  );

  if (intakeFormId && Array.isArray(source?.proposalData)) {
    const entry = source.proposalData.find(
      (item) => item?.formDefinitionId === intakeFormId,
    );
    if (entry) {
      return [
        {
          formDefinitionId: entry.formDefinitionId,
          answer: { ...entry.answer },
          savedAt: new Date().toISOString(),
        },
      ];
    }
  }

  if (
    source?.proposalData != null &&
    typeof source.proposalData === "object" &&
    !Array.isArray(source.proposalData)
  ) {
    return { ...source.proposalData };
  }

  return undefined;
}

/**
 * Build a CREATE_OPPORTUNITY input that copies intake form content + media only.
 *
 * @param {object} source - Full opportunity from GET_OPPORTUNITY
 * @param {object} options
 * @param {string} [options.userId]
 * @param {string} [options.myOrgId]
 * @param {string[]} [options.excludeFormDefinitionIds] - follow-up form ids
 * @param {string} [options.titleSuffix] - e.g. " (Copy)"
 */
export async function buildOpportunityCopyCreateInput(
  source,
  {
    userId = null,
    myOrgId = null,
    excludeFormDefinitionIds = [],
    titleSuffix = " (Copy)",
  } = {},
) {
  if (!source?.id) {
    throw new Error("Missing source opportunity");
  }

  const baseTitle = (source.title || "").trim() || "Opportunity";
  const input = {
    title: `${baseTitle}${titleSuffix}`,
    status: "draft",
  };

  for (const key of INTAKE_SCALAR_FIELDS) {
    if (source[key] !== undefined && source[key] !== null) {
      input[key] = source[key];
    }
  }

  const proposalData = buildIntakeProposalData(source, excludeFormDefinitionIds);
  if (proposalData !== undefined) {
    input.proposalData = proposalData;
  }

  if (userId) {
    input.sponsors = { connect: [{ id: userId }] };
  }
  if (myOrgId) {
    input.organization = { connect: { id: myOrgId } };
  }

  const networkIds = (source.classNetworks || [])
    .map((network) => network?.id)
    .filter(Boolean);
  if (networkIds.length > 0) {
    input.classNetworks = { connect: networkIds.map((id) => ({ id })) };
  }

  const mentorIds = (source.mentors || [])
    .map((mentor) => mentor?.id)
    .filter(Boolean);
  if (mentorIds.length > 0) {
    input.mentors = { connect: mentorIds.map((id) => ({ id })) };
  }

  const videoUpload = await fetchFileAsUpload(
    source.videoFile?.url,
    source.videoFile?.filename,
  );
  if (videoUpload) {
    input.videoFile = { upload: videoUpload };
  }

  const coverUpload = await fetchFileAsUpload(
    source.coverImage?.url,
    source.coverImage?.filename,
  );
  if (coverUpload) {
    input.coverImage = { upload: coverUpload };
  }

  return input;
}
