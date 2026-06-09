import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import {
  GET_OPPORTUNITY,
  MY_CLASS_NETWORKS_FOR_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { QUESTIONS_FOR_OPPORTUNITY } from "../../../Queries/ConnectQuestion";
import { GET_MY_ORGANIZATION } from "../../../Queries/Organization";
import {
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
} from "../../../Mutations/Opportunity";
import {
  CREATE_QUESTION,
  DELETE_QUESTION,
} from "../../../Mutations/ConnectQuestion";
import TipTapEditor from "../../../TipTap/Main";
import { deriveRoles } from "../useConnectRole";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: #171717;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Row = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: ${({ $cols }) => $cols || "1fr"};

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
  }

  span.hint {
    color: #888;
    font-size: 12px;
  }

  input[type="text"],
  input[type="number"],
  input[type="date"],
  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    background: #ffffff;
    cursor: pointer;
    font-size: 13px;
  }

  label.active {
    background: #336f8a;
    color: #ffffff;
    border-color: #336f8a;
  }

  input {
    display: none;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 100px;
  border: 1px solid ${({ $primary }) => ($primary ? "#336f8a" : "#d3dae0")};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#336f8a")};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GRADE_OPTIONS = [
  { value: "middle", label: "Middle School" },
  { value: "nine", label: "9 - 10 Grade" },
  { value: "eleven", label: "11 - 12 Grade" },
];

const CLASS_TYPE_OPTIONS = [
  { value: "accelerated", label: "Accelerated" },
  { value: "nonAccelerated", label: "Non-Accelerated" },
  { value: "ell", label: "ELL" },
];

const GROUP_FORMAT_OPTIONS = [
  { key: "individual", text: "Individual", value: "individual" },
  { key: "team", text: "Team", value: "team" },
  { key: "either", text: "Either", value: "either" },
];

const CATEGORY_OPTIONS = [
  { value: "urban_health", key: "urbanHealth" },
  { value: "urban_environment", key: "urbanEnvironment" },
  { value: "urban_infrastructure", key: "urbanInfrastructure" },
  { value: "other", key: "other" },
];

const DATA_SECURITY_OPTIONS = ["yes", "maybe", "no"];

const EMPTY_FORM = {
  title: "",
  shortDescription: "",
  description: "",
  projectCategory: "",
  projectCategoryOther: "",
  coverImageUrl: "",
  videoUrl: "",
  availableFrom: "",
  availableTo: "",
  timeCommitment: "",
  studentCapacity: 1,
  teamSize: 1,
  allowsTeamPreferences: false,
  preferGroupFormat: "either",
  status: "draft",
  // CUSP capstone fields
  sponsorIsMentor: true,
  mentorNotes: "",
  researchQuestion: "",
  relevance: "",
  dataRequirements: "",
  backgroundMethodology: "",
  dataSecurityConcerns: "no",
  dataSecurityNotes: "",
  techRequirements: "",
  fieldWorkLikelihood: 1,
  competencies: "",
  learningOutcomes: "",
  additionalNotes: "",
  guidelinesAcknowledged: false,
  requestsAppointment: false,
  // Special considerations (proposal-time)
  specialConsiderations: "",
  designedForSpecificStudents: "",
  anticipatedObstacles: "",
  requiresBusinessHours: "",
  privateClientDataNotes: "",
  fieldResearchTravelDetails: "",
  expectedDeliverables: "",
  // Post-acceptance details (only after admin accepts)
  scopeDescription: "",
  issueRelevance: "",
  potentialActivities: "",
  specificSkills: "",
};

function wordCount(value) {
  if (!value) return 0;
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function RequiredMark() {
  return <span style={{ color: "#b3261e" }}> *</span>;
}

function WordHint({ value, max }) {
  const { t } = useTranslation("connect");
  const count = wordCount(value);
  const over = count > max;
  return (
    <span
      className="hint"
      style={{ color: over ? "#b3261e" : "#888", fontSize: 11 }}
    >
      {t("opportunityEditor.wordCountTemplate", { count, max }, {
        default: "{{count}} / {{max}} words",
      })}{" "}
      {over
        ? t("opportunityEditor.wordCountOver", {}, { default: "— consider trimming" })
        : ""}
    </span>
  );
}

const LinkChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;

  a {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background: #eef5f9;
      border-color: #336f8a;
    }
  }
`;

const ScaleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
  }

  .scale-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .scale-btn {
    flex: 1;
    min-width: 40px;
    padding: 8px 0;
    border: 1px solid #d3dae0;
    border-radius: 8px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    cursor: pointer;
    text-align: center;

    &.active {
      background: #336f8a;
      color: #ffffff;
      border-color: #336f8a;
    }
  }
`;

function toDateInputValue(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function toIsoOrNull(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

export default function OpportunityEditor({ opportunityId, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const isNew = opportunityId === "new";
  const { hasExpandedOpportunityEditor, isAdmin } = deriveRoles(user);

  // Sponsors decide between drafting and submitting for review. Everything
  // beyond — accepting, publishing, closing — is reserved for admins so a
  // sponsor can't unilaterally accept or publish their own opportunity.
  const sponsorStatusOptions = [
    {
      key: "draft",
      text: t("opportunityEditor.statusOptions.draft", {}, {
        default: "Draft (not visible to students)",
      }),
      value: "draft",
    },
    {
      key: "pending_review",
      text: t("opportunityEditor.statusOptions.submitted", {}, {
        default: "Submitted for review",
      }),
      value: "pending_review",
    },
  ];

  const adminStatusOptions = [
    ...sponsorStatusOptions,
    {
      key: "accepted",
      text: t("opportunityEditor.statusOptions.accepted", {}, {
        default: "Accepted (complete post-acceptance details)",
      }),
      value: "accepted",
    },
    {
      key: "published",
      text: t("opportunityEditor.statusOptions.published", {}, {
        default: "Published",
      }),
      value: "published",
    },
    {
      key: "closed",
      text: t("opportunityEditor.statusOptions.closed", {}, {
        default: "Closed",
      }),
      value: "closed",
    },
    {
      key: "archived",
      text: t("opportunityEditor.statusOptions.archived", {}, {
        default: "Archived",
      }),
      value: "archived",
    },
  ];

  const statusOptions = isAdmin ? adminStatusOptions : sponsorStatusOptions;
  // Statuses only an admin can move to. Used at render time to lock the
  // dropdown for sponsors when their opportunity is in one of these states.
  const ADMIN_ONLY_STATUSES = new Set([
    "accepted",
    "published",
    "closed",
    "archived",
  ]);

  const { data: existing, loading: loadingOpportunity } = useQuery(
    GET_OPPORTUNITY,
    {
      variables: { id: opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: networksData } = useQuery(MY_CLASS_NETWORKS_FOR_OPPORTUNITY);
  const allNetworks = networksData?.classNetworks || [];

  // The current user's first Organization — auto-attached to new opportunities
  // so sponsors don't have to pick their own org on every create.
  const { data: myOrgData } = useQuery(GET_MY_ORGANIZATION);
  const myOrganizationId =
    myOrgData?.authenticatedItem?.organizations?.[0]?.id || null;

  const opportunity = existing?.opportunity;

  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  const [coverImageUpload, setCoverImageUpload] = useState(null);
  const [videoFileUpload, setVideoFileUpload] = useState(null);

  const MAX_COVER_BYTES = 10 * 1024 * 1024; // 10 MB
  const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

  // Tolerant URL validator: accepts http/https, returns a friendly hint when
  // the input looks wrong. Used as a non-blocking warning.
  const urlHint = (raw) => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    if (/^<iframe/i.test(trimmed)) {
      return "This looks like an embed code. Paste just the URL — we'll embed it for you.";
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return "URL should start with http:// or https://";
      }
      return null;
    } catch {
      return "That doesn't look like a valid URL.";
    }
  };

  const pickCoverImage = (file) => {
    if (!file) {
      setCoverImageUpload(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please pick an image file (JPG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      alert(
        `Cover image is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${MAX_COVER_BYTES / 1024 / 1024} MB. Compress it or pick a smaller image.`,
      );
      return;
    }
    setCoverImageUpload(file);
  };

  const pickVideoFile = (file) => {
    if (!file) {
      setVideoFileUpload(null);
      return;
    }
    if (!file.type.startsWith("video/")) {
      alert("Please pick a video file (MP4, WEBM, MOV, etc.).");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      alert(
        `Video is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${MAX_VIDEO_BYTES / 1024 / 1024} MB. Either compress the video or paste a YouTube / Vimeo / Loom URL below.`,
      );
      return;
    }
    setVideoFileUpload(file);
  };

  const [questionDraft, setQuestionDraft] = useState({
    prompt: "",
    questionType: "short_text",
    optionsText: "",
    isRequired: false,
  });

  const { data: questionsData, refetch: refetchQuestions } = useQuery(
    QUESTIONS_FOR_OPPORTUNITY,
    {
      variables: { opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );
  const opportunityQuestions = questionsData?.connectQuestions || [];

  const [createQuestion, { loading: addingQuestion }] = useMutation(
    CREATE_QUESTION
  );
  const [deleteQuestion] = useMutation(DELETE_QUESTION);

  const { inputs, handleChange, handleMultipleUpdate, toggleBoolean } = useForm(
    EMPTY_FORM
  );

  const [relevantLinks, setRelevantLinks] = useState([]);

  useEffect(() => {
    if (!opportunity) return;
    handleMultipleUpdate({
      title: opportunity.title || "",
      shortDescription: opportunity.shortDescription || "",
      description: opportunity.description || "",
      projectCategory: opportunity.projectCategory || "",
      projectCategoryOther: opportunity.projectCategoryOther || "",
      coverImageUrl: opportunity.coverImageUrl || "",
      videoUrl: opportunity.videoUrl || "",
      availableFrom: toDateInputValue(opportunity.availableFrom),
      availableTo: toDateInputValue(opportunity.availableTo),
      timeCommitment: opportunity.timeCommitment || "",
      studentCapacity: opportunity.studentCapacity ?? 1,
      teamSize: opportunity.teamSize ?? 1,
      allowsTeamPreferences: !!opportunity.allowsTeamPreferences,
      preferGroupFormat: opportunity.preferGroupFormat || "either",
      status: opportunity.status || "draft",
      // CUSP capstone fields
      sponsorIsMentor: opportunity.sponsorIsMentor ?? true,
      mentorNotes: opportunity.mentorNotes || "",
      researchQuestion: opportunity.researchQuestion || "",
      relevance: opportunity.relevance || "",
      dataRequirements: opportunity.dataRequirements || "",
      backgroundMethodology: opportunity.backgroundMethodology || "",
      dataSecurityConcerns: opportunity.dataSecurityConcerns || "no",
      dataSecurityNotes: opportunity.dataSecurityNotes || "",
      techRequirements: opportunity.techRequirements || "",
      fieldWorkLikelihood: opportunity.fieldWorkLikelihood ?? 1,
      competencies: opportunity.competencies || "",
      learningOutcomes: opportunity.learningOutcomes || "",
      additionalNotes: opportunity.additionalNotes || "",
      guidelinesAcknowledged: !!opportunity.guidelinesAcknowledged,
      requestsAppointment: !!opportunity.requestsAppointment,
      // Special considerations
      specialConsiderations: opportunity.specialConsiderations || "",
      designedForSpecificStudents:
        opportunity.designedForSpecificStudents || "",
      anticipatedObstacles: opportunity.anticipatedObstacles || "",
      requiresBusinessHours: opportunity.requiresBusinessHours || "",
      privateClientDataNotes: opportunity.privateClientDataNotes || "",
      fieldResearchTravelDetails:
        opportunity.fieldResearchTravelDetails || "",
      expectedDeliverables: opportunity.expectedDeliverables || "",
      // Post-acceptance details
      scopeDescription: opportunity.scopeDescription || "",
      issueRelevance: opportunity.issueRelevance || "",
      potentialActivities: opportunity.potentialActivities || "",
      specificSkills: opportunity.specificSkills || "",
    });
    setSelectedGrades(opportunity.preferGradeLevels || []);
    setSelectedClassTypes(opportunity.preferClassType || []);
    setSelectedNetworks(
      (opportunity.classNetworks || []).map((n) => n.id)
    );
    setRelevantLinks(
      Array.isArray(opportunity.relevantLinks) ? opportunity.relevantLinks : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity?.id]);

  const [createOpportunity, { loading: creating }] = useMutation(
    CREATE_OPPORTUNITY,
    {
      refetchQueries: [{ query: MY_OPPORTUNITIES }],
    }
  );
  const [updateOpportunity, { loading: updating }] = useMutation(
    UPDATE_OPPORTUNITY,
    {
      refetchQueries: isNew
        ? [{ query: MY_OPPORTUNITIES }]
        : [
            { query: MY_OPPORTUNITIES },
            { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
          ],
      awaitRefetchQueries: true,
    }
  );

  const saving = creating || updating;

  const toggleGrade = (value) => {
    setSelectedGrades((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleClassType = (value) => {
    setSelectedClassTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const SELECT_TYPES = ["single_select", "multi_select"];

  const handleAddQuestion = async () => {
    if (!questionDraft.prompt?.trim()) {
      alert("Question prompt is required.");
      return;
    }
    const needsOptions = SELECT_TYPES.includes(questionDraft.questionType);
    const options = needsOptions
      ? questionDraft.optionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: label }))
      : null;
    if (needsOptions && (!options || options.length === 0)) {
      alert("Provide at least one option for a select question.");
      return;
    }
    await createQuestion({
      variables: {
        input: {
          prompt: questionDraft.prompt,
          questionType: questionDraft.questionType,
          options,
          scope: "opportunity",
          opportunity: { connect: { id: opportunityId } },
          status: "approved",
          isRequired: !!questionDraft.isRequired,
          weight: 1.0,
          order: opportunityQuestions.length,
        },
      },
    });
    setQuestionDraft({
      prompt: "",
      questionType: "short_text",
      optionsText: "",
      isRequired: false,
    });
    refetchQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    if (
      !window.confirm(
        t("opportunityEditor.customQuestions.deleteConfirm", {}, {
          default: "Delete this question?",
        }),
      )
    )
      return;
    await deleteQuestion({ variables: { id } });
    refetchQuestions();
  };

  const validateCapstoneSponsorFields = () => {
    if (hasExpandedOpportunityEditor) return true;
    const checks = [
      [!inputs.shortDescription?.trim(), "validation.projectAbstract"],
      [!inputs.description?.trim(), "validation.projectDescription"],
      [!inputs.researchQuestion?.trim(), "validation.researchQuestion"],
      [!inputs.projectCategory, "validation.category"],
      [
        inputs.projectCategory === "other" && !inputs.projectCategoryOther?.trim(),
        "validation.categoryOther",
      ],
      [!inputs.relevance?.trim(), "validation.relevance"],
      [!inputs.dataRequirements?.trim(), "validation.dataRequirements"],
      [!inputs.backgroundMethodology?.trim(), "validation.backgroundMethodology"],
      [!inputs.competencies?.trim(), "validation.competencies"],
      [!inputs.learningOutcomes?.trim(), "validation.learningOutcomes"],
      [
        !relevantLinks.some((l) => l.url?.trim()),
        "validation.relevantLinks",
      ],
      [!inputs.additionalNotes?.trim(), "validation.additionalNotes"],
    ];
    for (const [failed, key] of checks) {
      if (failed) {
        alert(
          t(`opportunityEditor.${key}`, {}, {
            default: "Please complete all required fields.",
          }),
        );
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!inputs.title?.trim()) {
      alert(
        t("opportunityEditor.validation.title", {}, { default: "Title is required." }),
      );
      return;
    }
    if (!validateCapstoneSponsorFields()) return;
    // Acknowledgment is required for any progression past Draft — both when a
    // sponsor submits for review AND when an admin publishes. Keeps the
    // mutual-expectations check at the gate of the first non-draft state.
    if (inputs.status !== "draft" && !inputs.guidelinesAcknowledged) {
      alert(
        t("opportunityEditor.validation.guidelines", {}, {
          default:
            "Please tick the guidelines acknowledgment in the Publishing card before changing the status away from Draft.",
        }),
      );
      return;
    }

    const networkConnect = selectedNetworks.map((id) => ({ id }));

    const baseInput = {
      title: inputs.title,
      shortDescription: inputs.shortDescription || "",
      description: inputs.description || "",
      projectCategory: inputs.projectCategory || null,
      projectCategoryOther:
        inputs.projectCategory === "other"
          ? inputs.projectCategoryOther || ""
          : "",
      coverImageUrl: inputs.coverImageUrl || "",
      videoUrl: inputs.videoUrl || "",
      availableFrom: toIsoOrNull(inputs.availableFrom),
      availableTo: toIsoOrNull(inputs.availableTo),
      timeCommitment: inputs.timeCommitment || "",
      studentCapacity: Number(inputs.studentCapacity) || 1,
      teamSize: Number(inputs.teamSize) || 1,
      allowsTeamPreferences: !!inputs.allowsTeamPreferences,
      preferGradeLevels: selectedGrades,
      preferGroupFormat: inputs.preferGroupFormat || "either",
      preferClassType: selectedClassTypes,
      status: inputs.status || "draft",
      // CUSP capstone fields
      sponsorIsMentor: !!inputs.sponsorIsMentor,
      mentorNotes: inputs.mentorNotes || "",
      researchQuestion: inputs.researchQuestion || "",
      relevance: inputs.relevance || "",
      dataRequirements: inputs.dataRequirements || "",
      backgroundMethodology: inputs.backgroundMethodology || "",
      dataSecurityConcerns: inputs.dataSecurityConcerns || "no",
      dataSecurityNotes: inputs.dataSecurityNotes || "",
      techRequirements: inputs.techRequirements || "",
      fieldWorkLikelihood: Number(inputs.fieldWorkLikelihood) || null,
      competencies: inputs.competencies || "",
      learningOutcomes: inputs.learningOutcomes || "",
      relevantLinks: relevantLinks.length ? relevantLinks : null,
      additionalNotes: inputs.additionalNotes || "",
      guidelinesAcknowledged: !!inputs.guidelinesAcknowledged,
      // Stamp the acknowledgement time on first tick (audit trail).
      guidelinesAcknowledgedAt:
        inputs.guidelinesAcknowledged &&
        !opportunity?.guidelinesAcknowledgedAt
          ? new Date().toISOString()
          : opportunity?.guidelinesAcknowledgedAt || null,
      requestsAppointment: !!inputs.requestsAppointment,
      // Special considerations
      specialConsiderations: inputs.specialConsiderations || "",
      designedForSpecificStudents: inputs.designedForSpecificStudents || "",
      anticipatedObstacles: inputs.anticipatedObstacles || "",
      requiresBusinessHours: inputs.requiresBusinessHours || "",
      privateClientDataNotes: inputs.privateClientDataNotes || "",
      fieldResearchTravelDetails: inputs.fieldResearchTravelDetails || "",
      expectedDeliverables: inputs.expectedDeliverables || "",
      // Post-acceptance details
      scopeDescription: inputs.scopeDescription || "",
      issueRelevance: inputs.issueRelevance || "",
      potentialActivities: inputs.potentialActivities || "",
      specificSkills: inputs.specificSkills || "",
      // Auto-stamp the acceptance time when status first transitions to
      // "accepted" (this typically happens via an admin tool, but if it's
      // set in the editor we still mark the moment).
      acceptedAt:
        inputs.status === "accepted" && !opportunity?.acceptedAt
          ? new Date().toISOString()
          : opportunity?.acceptedAt || null,
    };

    // Only include the upload fields when the user actually picked a new file.
    // Keystone rejects an empty image/file input object.
    if (coverImageUpload) {
      baseInput.coverImage = { upload: coverImageUpload };
    }
    if (videoFileUpload) {
      baseInput.videoFile = { upload: videoFileUpload };
    }

    if (isNew) {
      const { data: created } = await createOpportunity({
        variables: {
          input: {
            ...baseInput,
            classNetworks: networkConnect.length
              ? { connect: networkConnect }
              : undefined,
            // Auto-attach the sponsor's organization (if any) so students
            // see the institutional identity on the opportunity card.
            organization: myOrganizationId
              ? { connect: { id: myOrganizationId } }
              : undefined,
          },
        },
      });
      if (created?.createOpportunity?.id) {
        router.replace({
          pathname: "/dashboard/connect/opportunities",
        });
      }
    } else {
      await updateOpportunity({
        variables: {
          id: opportunityId,
          input: {
            ...baseInput,
            classNetworks: { set: networkConnect },
            updatedAt: new Date().toISOString(),
          },
        },
      });
      router.replace({
        pathname: "/dashboard/connect/opportunities",
      });
    }
  };

  const handleCancel = () => {
    router.replace({ pathname: "/dashboard/connect/opportunities" });
  };

  if (!isNew && loadingOpportunity && !opportunity) {
    return (
      <Shell>
        <p>{t("opportunityEditor.loading", {}, { default: "Loading opportunity…" })}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" />{" "}
            {t("opportunityEditor.backLink", {}, { default: "Back to opportunities" })}
          </BackLink>
          <h1>
            {isNew
              ? t("opportunityEditor.pageTitleNew", {}, { default: "New opportunity" })
              : t("opportunityEditor.pageTitleEdit", {}, { default: "Edit opportunity" })}
          </h1>
        </div>
      </TopBar>

      <Card>
        <h2>{t("opportunityEditor.basics", {}, { default: "Basics" })}</h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.projectTitle", {}, { default: "Project Title" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.projectTitleDescription", {}, {
              default: "15 words maximum. Tips: Be engaging for student appeal",
            })}
          </span>
          <input
            type="text"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            placeholder={t("opportunityEditor.projectTitlePlaceholder", {}, {
              default: "e.g. Neuroscience summer mentorship",
            })}
          />
          <WordHint value={inputs.title} max={15} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.projectAbstract", {}, {
              default: "Capstone Project Abstract",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.projectAbstractDescription", {}, {
              default:
                "100 words maximum. Info provided here may be used on the CUSP website, in other promotional materials, and in Urban Science Intensive course descriptions for students.",
            })}
          </span>
          <textarea
            name="shortDescription"
            value={inputs.shortDescription}
            onChange={handleChange}
          />
          <WordHint value={inputs.shortDescription} max={100} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.projectDescription", {}, {
              default: "Capstone Project Description & Overview",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.projectDescriptionDescription", {}, {
              default:
                "250 words maximum. Describe the scope and nature of the capstone project. Please ensure that the project is achievable within the academic timeframe and with the resources available. Info provided here may be used on the CUSP website, in other promotional materials, and in Urban Science Intensive course descriptions for students.",
            })}
          </span>
          <TipTapEditor
            content={inputs.description}
            placeholder={t("opportunityEditor.descriptionPlaceholder", {}, {
              default: "What will students do? What will they learn?",
            })}
            onUpdate={(newContent) =>
              handleMultipleUpdate({ description: newContent })
            }
          />
          <WordHint value={inputs.description} max={250} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.researchQuestion", {}, {
              default:
                "What is the research question/scope to be explored OR what is the problem that you want to address?",
            })}
            <RequiredMark />
          </span>
          <textarea
            name="researchQuestion"
            value={inputs.researchQuestion}
            onChange={handleChange}
          />
        </Field>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.coverImage", {}, { default: "Cover image" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.coverImageHint", {}, {
                default:
                  "Upload a file (stored on our cloud bucket) or paste a direct image URL below. Uploaded files take priority if both are set.",
              })}
            </span>
            {opportunity?.coverImage?.url && !coverImageUpload && (
              <div
                style={{
                  marginBottom: 8,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #d3dae0",
                  maxWidth: 280,
                }}
              >
                <img
                  src={opportunity.coverImage.url}
                  alt={inputs.title || "Cover"}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickCoverImage(e.target.files?.[0] || null)}
            />
            {coverImageUpload && (
              <div style={{ fontSize: 12, color: "#1d8f47", marginTop: 4 }}>
                Ready to upload: {coverImageUpload.name} (
                {Math.round(coverImageUpload.size / 1024)} KB)
              </div>
            )}
            <span className="hint" style={{ marginTop: 8 }}>
              {t("opportunityEditor.coverImageUrlHint", {
                maxMb: MAX_COVER_BYTES / 1024 / 1024,
              }, {
                default: "Or paste a URL (max {{maxMb}} MB for uploads):",
              })}
            </span>
            <input
              type="text"
              name="coverImageUrl"
              value={inputs.coverImageUrl}
              onChange={handleChange}
              placeholder="https://…"
            />
            {urlHint(inputs.coverImageUrl) && (
              <div style={{ fontSize: 12, color: "#b3261e", marginTop: 4 }}>
                <Icon name="warning circle" />{" "}
                {urlHint(inputs.coverImageUrl)}
              </div>
            )}
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.introVideo", {}, { default: "Intro video" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.introVideoHint", {}, {
                default:
                  "Upload a video file or paste an embed URL (YouTube, Vimeo). Uploaded files are stored on our cloud bucket.",
              })}
            </span>
            {opportunity?.videoFile?.url && !videoFileUpload && (
              <div
                style={{
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #d3dae0",
                  background: "#f7f9f8",
                  fontSize: 13,
                  color: "#5f6871",
                }}
              >
                <Icon name="film" />{" "}
                {t("opportunityEditor.videoCurrentUpload", {}, {
                  default: "Current upload:",
                })}{" "}
                <a
                  href={opportunity.videoFile.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#336f8a" }}
                >
                  {opportunity.videoFile.filename || "video file"}
                </a>
              </div>
            )}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => pickVideoFile(e.target.files?.[0] || null)}
            />
            {videoFileUpload && (
              <div style={{ fontSize: 12, color: "#1d8f47", marginTop: 4 }}>
                Ready to upload: {videoFileUpload.name} (
                {Math.round(videoFileUpload.size / 1024 / 1024)} MB)
              </div>
            )}
            <span className="hint" style={{ marginTop: 8 }}>
              {t("opportunityEditor.introVideoUrlHint", {
                maxMb: MAX_VIDEO_BYTES / 1024 / 1024,
              }, {
                default:
                  "Or paste a video URL (the URL itself — not the full <iframe> embed code). Supports YouTube, Vimeo, Loom, Google Drive, or a direct .mp4/.webm link. Maximum upload size: {{maxMb}} MB.",
              })}
            </span>
            <input
              type="text"
              name="videoUrl"
              value={inputs.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=…"
            />
            {urlHint(inputs.videoUrl) && (
              <div style={{ fontSize: 12, color: "#b3261e", marginTop: 4 }}>
                <Icon name="warning circle" /> {urlHint(inputs.videoUrl)}
              </div>
            )}
          </Field>
        </Row>
      </Card>

      <Card>
        <h2>
          {t("opportunityEditor.categorization", {}, { default: "Categorization" })}
          <RequiredMark />
        </h2>
        <Field>
          <span className="hint">
            {t("opportunityEditor.categorizationDescription", {}, {
              default: "Which category does your project align with?",
            })}
          </span>
          <CheckboxRow>
            {CATEGORY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={inputs.projectCategory === opt.value ? "active" : ""}
              >
                <input
                  type="radio"
                  name="projectCategory"
                  checked={inputs.projectCategory === opt.value}
                  onChange={() =>
                    handleMultipleUpdate({ projectCategory: opt.value })
                  }
                />
                {t(`opportunityEditor.categorizationOptions.${opt.key}`, {}, {
                  default: opt.key,
                })}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        {inputs.projectCategory === "other" && (
          <Field>
            <span className="label-text">
              {t("opportunityEditor.categorizationOther", {}, {
                default: "Other category",
              })}
              <RequiredMark />
            </span>
            <input
              type="text"
              name="projectCategoryOther"
              value={inputs.projectCategoryOther}
              onChange={handleChange}
            />
          </Field>
        )}
      </Card>

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.availabilityCapacity", {}, {
            default: "Availability & capacity",
          })}
        </h2>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.availableFrom", {}, { default: "Available from" })}
            </span>
            <input
              type="date"
              name="availableFrom"
              value={inputs.availableFrom}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.availableTo", {}, { default: "Available to" })}
            </span>
            <input
              type="date"
              name="availableTo"
              value={inputs.availableTo}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.timeCommitment", {}, { default: "Time commitment" })}
          </span>
          <input
            type="text"
            name="timeCommitment"
            value={inputs.timeCommitment}
            onChange={handleChange}
            placeholder={t("opportunityEditor.timeCommitmentPlaceholder", {}, {
              default: "e.g. 3 hours per week for 8 weeks",
            })}
          />
        </Field>
        <Row $cols="1fr 1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.studentCapacity", {}, { default: "Student capacity" })}
            </span>
            <input
              type="number"
              name="studentCapacity"
              min="1"
              value={inputs.studentCapacity}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.teamSize", {}, { default: "Team size" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.teamSizeHint", {}, { default: "1 = solo placement." })}
            </span>
            <input
              type="number"
              name="teamSize"
              min="1"
              value={inputs.teamSize}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.groupFormat", {}, { default: "Group format" })}
            </span>
            <Dropdown
              selection
              options={GROUP_FORMAT_OPTIONS}
              value={inputs.preferGroupFormat}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ preferGroupFormat: value })
              }
            />
          </Field>
        </Row>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="allowsTeamPreferences"
              checked={!!inputs.allowsTeamPreferences}
              onChange={toggleBoolean}
            />
            <span>
              {t("opportunityEditor.teamPreferences", {}, {
                default:
                  "Allow students to nominate preferred teammates for this opportunity",
              })}
            </span>
          </label>
        </Field>
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.audiencePreferences", {}, {
            default: "Audience preferences",
          })}
        </h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.preferredGrades", {}, {
              default: "Preferred grade levels",
            })}
          </span>
          <CheckboxRow>
            {GRADE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={selectedGrades.includes(opt.value) ? "active" : ""}
              >
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(opt.value)}
                  onChange={() => toggleGrade(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.preferredClassTypes", {}, {
              default: "Preferred class types",
            })}
          </span>
          <CheckboxRow>
            {CLASS_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={
                  selectedClassTypes.includes(opt.value) ? "active" : ""
                }
              >
                <input
                  type="checkbox"
                  checked={selectedClassTypes.includes(opt.value)}
                  onChange={() => toggleClassType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.offeredInNetworks", {}, {
              default: "Offered in class networks",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.offeredInNetworksHint", {}, {
              default: "Pick which networks can see this opportunity.",
            })}
          </span>
          <Dropdown
            placeholder="Select class networks"
            fluid
            multiple
            selection
            search
            options={allNetworks.map((n) => ({
              key: n.id,
              text: n.title,
              value: n.id,
            }))}
            value={selectedNetworks}
            onChange={(_, { value }) => setSelectedNetworks(value)}
          />
        </Field>
      </Card>
      )}

      <Card>
        <h2>{t("opportunityEditor.questionnaire", {}, { default: "Questionnaire" })}</h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.relevance", {}, { default: "Relevance" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.relevanceDescription", {}, {
              default:
                "Describe why this issue is of relevance to CUSP's mission and urban science.",
            })}
          </span>
          <textarea
            name="relevance"
            value={inputs.relevance}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.dataRequirements", {}, {
              default:
                "What are the anticipated data requirements for the project, and how will each required data resource be provided to the capstone team?",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.dataRequirementsDescription", {}, {
              default:
                "Please describe what datasets will be used. For example, existing source data will be provided by the sponsor, existing source data is free and open (public), etc. Info provided here may be used on the CUSP website, in other promotional materials, and in Urban Science Intensive course descriptions for students.",
            })}
          </span>
          <textarea
            name="dataRequirements"
            value={inputs.dataRequirements}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.backgroundMethodology", {}, {
              default: "Background & Methodology",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.backgroundMethodologyDescription", {}, {
              default:
                "Please include any important contextual information related to your project, and outline your methodologies including specific research approaches, data collection techniques, tools, and technologies.",
            })}
          </span>
          <textarea
            name="backgroundMethodology"
            value={inputs.backgroundMethodology}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.dataSecurityConcerns", {}, {
              default:
                "Does the sponsor have any anticipated data security concerns to be cleared for student team?",
            })}
            <RequiredMark />
          </span>
          <CheckboxRow>
            {DATA_SECURITY_OPTIONS.map((value) => (
              <label
                key={value}
                className={
                  inputs.dataSecurityConcerns === value ? "active" : ""
                }
              >
                <input
                  type="radio"
                  name="dataSecurityConcerns"
                  checked={inputs.dataSecurityConcerns === value}
                  onChange={() =>
                    handleMultipleUpdate({ dataSecurityConcerns: value })
                  }
                />
                {t(`opportunityEditor.dataSecurityOptions.${value}`, {}, {
                  default: value,
                })}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        {(inputs.dataSecurityConcerns === "yes" ||
          inputs.dataSecurityConcerns === "maybe") && (
          <Field>
            <span className="label-text">
              {t("opportunityEditor.dataSecurityNotes", {}, {
                default: "If yes or maybe, please describe concerns.",
              })}
            </span>
            <textarea
              name="dataSecurityNotes"
              value={inputs.dataSecurityNotes}
              onChange={handleChange}
            />
          </Field>
        )}
        <Field>
          <span className="label-text">
            {t("opportunityEditor.techRequirements", {}, {
              default:
                "Does the sponsor have technology infrastructure and/or software application requirements for this project?",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.techRequirementsDescription", {}, {
              default:
                "For example, the project requires GIS data analysis and the sponsor uses ArcGIS or RShiny for mapping. If the sponsor has no preferences as to data tools used, please indicate.",
            })}
          </span>
          <textarea
            name="techRequirements"
            value={inputs.techRequirements}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.fieldWorkLikelihood", {}, {
              default:
                "How likely would the project require field work or site visits (either within NYC or outside)?",
            })}
            <RequiredMark />
          </span>
          <ScaleRow>
            <div className="scale-labels">
              <span>
                {t("opportunityEditor.fieldWorkScale.unlikely", {}, {
                  default: "Very unlikely",
                })}
              </span>
              <span>
                {t("opportunityEditor.fieldWorkScale.likely", {}, {
                  default: "Very likely",
                })}
              </span>
            </div>
            <div className="scale-buttons">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`scale-btn${
                    Number(inputs.fieldWorkLikelihood) === n ? " active" : ""
                  }`}
                  onClick={() =>
                    handleMultipleUpdate({ fieldWorkLikelihood: n })
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </ScaleRow>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.competencies", {}, { default: "Competencies" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.competenciesDescription", {}, {
              default:
                "List any specific skills or qualifications that would be useful for students to have in order to successfully address this problem and complete the capstone project. For example, user experience design, software programming, economics/financial analysis, public policy analysis, quantitative research/analysis, engineering skills (mechanical, electrical, etc). Info provided here may be used on the CUSP website, in other promotional materials, and in Urban Science Intensive course descriptions for students.",
            })}
          </span>
          <textarea
            name="competencies"
            value={inputs.competencies}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.learningOutcomes", {}, {
              default: "Learning Outcomes/Deliverables",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.learningOutcomesDescription", {}, {
              default:
                "Provide 2-3 learning outcomes or expected deliverables. For example, an interactive dashboard or a website showcasing data analysis outcomes. Info provided here may be used on the CUSP website, in other promotional materials, and in Urban Science Intensive course descriptions for students.",
            })}
          </span>
          <textarea
            name="learningOutcomes"
            value={inputs.learningOutcomes}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.relevantLinks", {}, { default: "Relevant Links" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.relevantLinksDescription", {}, {
              default:
                "This can include a project website, GitHub repository, or other online presence where one can learn more about the project. We'll include QR codes in the brochure.",
            })}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relevantLinks.map((link, idx) => (
              <div
                key={idx}
                style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}
              >
                <input
                  type="text"
                  placeholder={t("opportunityEditor.relevantLinksLabel", {}, {
                    default: "Label",
                  })}
                  value={link.label || ""}
                  onChange={(e) => {
                    const next = [...relevantLinks];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setRelevantLinks(next);
                  }}
                />
                <input
                  type="text"
                  placeholder="https://…"
                  value={link.url || ""}
                  onChange={(e) => {
                    const next = [...relevantLinks];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setRelevantLinks(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setRelevantLinks(
                      relevantLinks.filter((_, i) => i !== idx),
                    )
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: 100,
                    border: "1px solid #e8c4c4",
                    background: "#fff",
                    color: "#b3261e",
                    fontFamily: "Nunito",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {t("opportunityEditor.relevantLinksRemove", {}, {
                    default: "Remove",
                  })}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setRelevantLinks([...relevantLinks, { label: "", url: "" }])
              }
              style={{
                alignSelf: "flex-start",
                padding: "6px 14px",
                borderRadius: 100,
                border: "1px dashed #d3dae0",
                background: "#fff",
                color: "#336f8a",
                fontFamily: "Nunito",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              + {t("opportunityEditor.relevantLinksAdd", {}, { default: "Add link" })}
            </button>
          </div>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.additionalNotes", {}, {
              default: "Is there any additional information you would like to highlight?",
            })}
            <RequiredMark />
          </span>
          <textarea
            name="additionalNotes"
            value={inputs.additionalNotes}
            onChange={handleChange}
          />
        </Field>
      </Card>

      {hasExpandedOpportunityEditor && (
      <Card>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="sponsorIsMentor"
              checked={!!inputs.sponsorIsMentor}
              onChange={toggleBoolean}
            />
            <span>
              {t("opportunityEditor.sponsorIsMentor", {}, {
                default:
                  "I'm also the day-to-day mentor for this project (uncheck if someone else will be mentoring)",
              })}
            </span>
          </label>
        </Field>
        {!inputs.sponsorIsMentor && (
          <Field>
            <span className="label-text">
              {t("opportunityEditor.mentorNotes", {}, { default: "Mentor notes" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.mentorNotesDescription", {}, {
                default:
                  "Name, title, contact, and availability of the day-to-day mentor. If no mentor is available, describe the gaps and CUSP can help identify support.",
              })}
            </span>
            <textarea
              name="mentorNotes"
              value={inputs.mentorNotes}
              onChange={handleChange}
            />
          </Field>
        )}
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.customQuestions.title", {}, {
            default: "Custom application questions",
          })}
        </h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          {t("opportunityEditor.customQuestions.description", {}, {
            default:
              "Optional questions students answer when they rank this opportunity. Used by the matching algorithm.",
          })}
        </p>
        {isNew ? (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            {t("opportunityEditor.customQuestions.saveFirst", {}, {
              default:
                "Save the opportunity first, then come back here to add custom questions.",
            })}
          </p>
        ) : (
          <>
            {opportunityQuestions.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {opportunityQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      border: "1px solid #d3dae0",
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#171717" }}>
                        {q.prompt}
                      </div>
                      <div style={{ color: "#5f6871", fontSize: 12 }}>
                        {q.questionType}
                        {q.isRequired ? " · required" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 100,
                        border: "1px solid #e8c4c4",
                        background: "#fff",
                        color: "#b3261e",
                        fontFamily: "Nunito",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {t("opportunityEditor.customQuestions.delete", {}, {
                        default: "Delete",
                      })}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 12,
                padding: 16,
                border: "1px dashed #d3dae0",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <strong style={{ color: "#171717" }}>
                {t("opportunityEditor.customQuestions.addPrompt", {}, {
                  default: "Add a question",
                })}
              </strong>
              <Field>
                <span className="label-text">
                  {t("opportunityEditor.customQuestions.prompt", {}, {
                    default: "Prompt",
                  })}
                </span>
                <input
                  type="text"
                  value={questionDraft.prompt}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      prompt: e.target.value,
                    })
                  }
                  placeholder={t(
                    "opportunityEditor.customQuestions.promptPlaceholder",
                    {},
                    { default: "e.g. Why are you interested in this project?" },
                  )}
                />
              </Field>
              <Field>
                <span className="label-text">
                  {t("opportunityEditor.customQuestions.questionType", {}, {
                    default: "Question type",
                  })}
                </span>
                <Dropdown
                  selection
                  options={[
                    { key: "short_text", text: "Short text", value: "short_text" },
                    { key: "long_text", text: "Long text", value: "long_text" },
                    {
                      key: "single_select",
                      text: "Single select",
                      value: "single_select",
                    },
                    {
                      key: "multi_select",
                      text: "Multi select",
                      value: "multi_select",
                    },
                    { key: "scale_1_5", text: "1-5 scale", value: "scale_1_5" },
                    { key: "yes_no", text: "Yes / no", value: "yes_no" },
                  ]}
                  value={questionDraft.questionType}
                  onChange={(_, { value }) =>
                    setQuestionDraft({
                      ...questionDraft,
                      questionType: value,
                    })
                  }
                />
              </Field>
              {SELECT_TYPES.includes(questionDraft.questionType) && (
                <Field>
                  <span className="label-text">
                    {t("opportunityEditor.customQuestions.options", {}, {
                      default: "Options (one per line)",
                    })}
                  </span>
                  <textarea
                    value={questionDraft.optionsText}
                    onChange={(e) =>
                      setQuestionDraft({
                        ...questionDraft,
                        optionsText: e.target.value,
                      })
                    }
                  />
                </Field>
              )}
              <label
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={questionDraft.isRequired}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      isRequired: e.target.checked,
                    })
                  }
                />
                <span>
                  {t("opportunityEditor.customQuestions.isRequired", {}, {
                    default: "Required",
                  })}
                </span>
              </label>
              <div>
                <Button
                  type="button"
                  $primary
                  onClick={handleAddQuestion}
                  disabled={addingQuestion}
                >
                  {addingQuestion
                    ? t("opportunityEditor.saving", {}, { default: "Saving…" })
                    : t("opportunityEditor.customQuestions.add", {}, {
                        default: "Add question",
                      })}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      )}

      <Card>
        <h2>Special considerations</h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          Tell us anything the Capstone Project Team should know that
          doesn&apos;t fit elsewhere. Optional but very helpful for matching.
        </p>

        <Field>
          <span className="label-text">Special considerations</span>
          <span className="hint">
            If applicable, describe anything the Capstone Project Team should
            be aware of.
          </span>
          <textarea
            name="specialConsiderations"
            value={inputs.specialConsiderations}
            onChange={handleChange}
          />
        </Field>

        <Field>
          <span className="label-text">
            Designed with specific NYU CUSP students in mind?
          </span>
          <span className="hint">
            If yes, list the student names. Aim for 15 words or fewer.
          </span>
          <textarea
            name="designedForSpecificStudents"
            value={inputs.designedForSpecificStudents}
            onChange={handleChange}
            rows={2}
          />
          <WordHint value={inputs.designedForSpecificStudents} max={15} />
        </Field>

        <Field>
          <span className="label-text">Anticipated obstacles</span>
          <span className="hint">
            Things a Capstone Team might run into — incomplete data, lack of
            buy-in, staff turnover, etc. Aim for 250 words or fewer.
          </span>
          <textarea
            name="anticipatedObstacles"
            value={inputs.anticipatedObstacles}
            onChange={handleChange}
          />
          <WordHint value={inputs.anticipatedObstacles} max={250} />
        </Field>

        <Field>
          <span className="label-text">
            Significant research during business hours?
          </span>
          <span className="hint">
            Many students work full-time. Tell us if daytime availability is
            needed. Aim for 50 words or fewer.
          </span>
          <textarea
            name="requiresBusinessHours"
            value={inputs.requiresBusinessHours}
            onChange={handleChange}
            rows={3}
          />
          <WordHint value={inputs.requiresBusinessHours} max={50} />
        </Field>

        <Field>
          <span className="label-text">Private client data access</span>
          <span className="hint">
            Will the team access private client data? When/how will approval
            be in place? Aim for 100 words or fewer.
          </span>
          <textarea
            name="privateClientDataNotes"
            value={inputs.privateClientDataNotes}
            onChange={handleChange}
          />
          <WordHint value={inputs.privateClientDataNotes} max={100} />
        </Field>

        <Field>
          <span className="label-text">Field research and travel</span>
          <span className="hint">
            Will the team need to visit other locations? Where? Aim for 250
            words or fewer.
          </span>
          <textarea
            name="fieldResearchTravelDetails"
            value={inputs.fieldResearchTravelDetails}
            onChange={handleChange}
          />
          <WordHint value={inputs.fieldResearchTravelDetails} max={250} />
        </Field>

        <Field>
          <span className="label-text">Expected deliverables</span>
          <span className="hint">
            What will the team produce at the end — instruments, policies,
            datasets, a report, recommendations? Aim for 250 words or fewer.
          </span>
          <textarea
            name="expectedDeliverables"
            value={inputs.expectedDeliverables}
            onChange={handleChange}
          />
          <WordHint value={inputs.expectedDeliverables} max={250} />
        </Field>
      </Card>

      {(inputs.status === "accepted" ||
        inputs.status === "published" ||
        inputs.status === "closed" ||
        opportunity?.acceptedAt) && (
        <Card>
          <h2>You&apos;ve been accepted — let&apos;s lock in the details</h2>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#e3f4ec",
              border: "1px solid #b6dec7",
              color: "#1d6b3a",
              fontSize: 13,
            }}
          >
            <Icon name="check circle" /> Your proposal was accepted
            {opportunity?.acceptedAt
              ? ` on ${new Date(opportunity.acceptedAt).toLocaleDateString()}`
              : ""}
            . Please complete the four sections below — they help students
            understand what they&apos;ll be doing before you publish.
          </div>

          <Field>
            <span className="label-text">Scope of the project</span>
            <span className="hint">
              Best Capstone proposals are important but not urgent, achievable
              within the academic timeframe, have a clear problem definition,
              a realistic scope, and specify tangible deliverables.
            </span>
            <textarea
              name="scopeDescription"
              value={inputs.scopeDescription}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <span className="label-text">
              Why is this issue of particular relevance to your organization?
            </span>
            <span className="hint">
              Implications for your agency. Aim for 500 words or fewer.
            </span>
            <textarea
              name="issueRelevance"
              value={inputs.issueRelevance}
              onChange={handleChange}
            />
            <WordHint value={inputs.issueRelevance} max={500} />
          </Field>

          <Field>
            <span className="label-text">Potential activities</span>
            <span className="hint">
              What the team might do: literature review, survey, program
              evaluation, dataset analysis, etc. Aim for 500 words or fewer.
            </span>
            <textarea
              name="potentialActivities"
              value={inputs.potentialActivities}
              onChange={handleChange}
            />
            <WordHint value={inputs.potentialActivities} max={500} />
          </Field>

          <Field>
            <span className="label-text">
              Specific skills or qualifications
            </span>
            <span className="hint">
              Software knowledge, statistics, issue-area experience, etc. Aim
              for 500 words or fewer.
            </span>
            <textarea
              name="specificSkills"
              value={inputs.specificSkills}
              onChange={handleChange}
            />
            <WordHint value={inputs.specificSkills} max={500} />
          </Field>
        </Card>
      )}

      <Card>
        <h2>{t("opportunityEditor.publishing", {}, { default: "Publishing" })}</h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.status", {}, { default: "Status" })}
          </span>
          {!isAdmin && ADMIN_ONLY_STATUSES.has(inputs.status) ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#f7f9f8",
                border: "1px solid #d3dae0",
                color: "#171717",
                fontSize: 14,
              }}
            >
              <Icon name="lock" />
              <strong style={{ textTransform: "capitalize" }}>
                {inputs.status.replace("_", " ")}
              </strong>
              <span style={{ color: "#5f6871", fontSize: 13 }}>
                — locked. Ask an admin to change the status.
              </span>
            </div>
          ) : (
            <Dropdown
              selection
              options={statusOptions}
              value={inputs.status}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ status: value })
              }
            />
          )}
          {!isAdmin && (
            <span className="hint" style={{ marginTop: 4 }}>
              Set to <strong>Submitted for review</strong> when your proposal
              is ready — an admin will review and publish it.
            </span>
          )}
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.guidelinesTitle", {}, {
              default: "Understanding of Proposal Guidelines",
            })}
            <RequiredMark />
          </span>
          <span style={{ fontSize: 14, color: "#171717", lineHeight: 1.5 }}>
            {t("opportunityEditor.guidelinesDescription", {}, {
              default:
                "I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.",
            })}
          </span>
          <LinkChipRow>
            <a
              href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects"
              target="_blank"
              rel="noreferrer"
            >
              {t("opportunityEditor.guidelinesFaqsChip", {}, {
                default: "Capstone Sponsor FAQs",
              })}
            </a>
            <a
              href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations"
              target="_blank"
              rel="noreferrer"
            >
              {t("opportunityEditor.guidelinesMutualExpectationsChip", {}, {
                default: "Mutual Expectations agreement",
              })}
            </a>
          </LinkChipRow>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              fontSize: 14,
              color: "#171717",
            }}
          >
            <input
              type="checkbox"
              name="guidelinesAcknowledged"
              checked={!!inputs.guidelinesAcknowledged}
              onChange={toggleBoolean}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>
                {t("opportunityEditor.guidelinesAgree", {}, {
                  default: "I agree with this statement.",
                })}
              </strong>
            </span>
          </label>
          {opportunity?.guidelinesAcknowledgedAt && (
            <span className="hint" style={{ marginLeft: 26 }}>
              {t("opportunityEditor.guidelinesAcknowledgedAt", {
                date: new Date(
                  opportunity.guidelinesAcknowledgedAt,
                ).toLocaleString(),
              }, {
                default: "Acknowledged {{date}}",
              })}
            </span>
          )}
        </Field>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              fontSize: 14,
              color: "#171717",
            }}
          >
            <input
              type="checkbox"
              name="requestsAppointment"
              checked={!!inputs.requestsAppointment}
              onChange={toggleBoolean}
              style={{ marginTop: 3 }}
            />
            <span>
              {t("opportunityEditor.guidelinesRequestAppointment", {}, {
                default: "I request an appointment to discuss further.",
              })}
            </span>
          </label>
        </Field>
        {inputs.status !== "draft" && !inputs.guidelinesAcknowledged && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#fdf1f1",
              border: "1px solid #f1c8c8",
              color: "#b3261e",
              fontSize: 13,
            }}
          >
            <Icon name="warning circle" />{" "}
            {t("opportunityEditor.guidelinesWarning", {}, {
              default:
                "Tick the guidelines checkbox before moving the status away from Draft.",
            })}
          </div>
        )}
      </Card>

      <Actions>
        <Button type="button" onClick={handleCancel} disabled={saving}>
          {t("opportunityEditor.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button type="button" $primary onClick={handleSave} disabled={saving}>
          {saving
            ? t("opportunityEditor.saving", {}, { default: "Saving…" })
            : isNew
            ? t("opportunityEditor.create", {}, { default: "Create opportunity" })
            : t("opportunityEditor.save", {}, { default: "Save changes" })}
        </Button>
      </Actions>
    </Shell>
  );
}
