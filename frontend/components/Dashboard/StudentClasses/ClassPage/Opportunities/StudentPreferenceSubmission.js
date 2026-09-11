import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import { GET_PARTICIPATE_VIEW } from "../../../../Queries/ConnectPreference";
import { CURRENT_USER_QUERY } from "../../../../Queries/User";
import { TOGGLE_FAVORITE_OPPORTUNITY } from "../../../../Mutations/Opportunity";
import { formatOpportunitySponsorLabel } from "../../../../../lib/opportunityPeople";
import {
  deriveRankingOpportunityIds,
  filterRankingEntriesForSave,
  getDraftDriftedOpportunityIds,
  getFavoriteOppIdsInRound,
  isPreferenceSnapshotLocked,
  isRoundRankingEditable,
  pruneRankingsToOpportunityIds,
} from "../../../../../lib/opportunityFavoriteRanking";
import {
  formatPreferenceWindowInstant,
  getPreferenceTimeWindowState,
  readPreferenceWindowTimeZone,
  resolvePreferenceWindowInstantMs,
} from "../../../../../lib/connectRoundSettings";
import {
  CREATE_PREFERENCE,
  UPDATE_PREFERENCE,
  DELETE_PREFERENCE_ITEMS,
  CREATE_TEAM_PREFERENCES,
  DELETE_TEAM_PREFERENCES,
  CREATE_QUESTION_ANSWERS,
  DELETE_QUESTION_ANSWERS,
} from "../../../../Mutations/ConnectPreference";
import {
  CREATE_RATING,
  UPDATE_RATING,
} from "../../../../Mutations/ConnectRating";
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import MessageCard from "../../../../DesignSystem/MessageCard";
import { AddIcon } from "../../../../DesignSystem/Icons";
import ClassmateRankList, {
  deriveClassmateOrder,
} from "./ClassmateRankList";
import { buildFavoritedTeamProjectsNote, getLargestTeamOpportunity } from "./classmatePickLimitCopy";
import {
  getMaxActiveClassmatePicks,
  getStudentTeamEligibleOpportunities,
  getTeamEligibleOpportunities,
} from "../../../../../lib/connectBallotUtils";
import {
  buildStudentMatchingPreference,
  getMatchingQueue,
} from "../../../../../lib/connectPreferenceMatchingPreference";
import FavoriteRankList from "./FavoriteRankList";
import PreferenceSubmissionReview from "./PreferenceSubmissionReview";
import PreferenceSubmissionStepper, {
  buildPreferenceStepKeys,
} from "./PreferenceSubmissionStepper";
import StudentAssessmentStep from "./StudentAssessmentStep";
import StudentMatchingPreferenceCard from "./StudentMatchingPreferenceCard";
import RankingDriftRepairModal from "./RankingDriftRepairModal";
import {
  isAssessmentDataEntries,
  isAssessmentFormAnswerComplete,
} from "../../../../../lib/connectPreferenceAssessmentData";

/** Round/opportunity questions are deferred; keep save paths dormant until re-enabled. */
const PREFERENCE_QUESTIONS_ENABLED = false;
const EMPTY_OPPORTUNITIES = [];

function hasRankedPreferenceItems(rankings) {
  return Object.entries(rankings).some(([, r]) => {
    if (!r) return false;
    return (
      (r.rank !== "" && r.rank !== undefined && r.rank !== null) ||
      (r.starRating !== "" &&
        r.starRating !== undefined &&
        r.starRating !== null) ||
      (r.comment || "").trim()
    );
  });
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

  h2 {
    margin: 0;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #171717;
  }

  .helper {
    color: #5f6871;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font: var(--MH-Type-Label-Base);
  letter-spacing: 0;
  color: #5f6871;

  span.label-text {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: #171717;
  }

  span.hint {
    color: #888;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }

  input[type="text"],
  input[type="number"],
  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #171717;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }
`;

const RankFormHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  padding: 8px 16px;
  margin-bottom: 8px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const RankTitleWrap = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;

  h1 {
    margin: 0;
    min-width: 0;
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const RankSubmitActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
  flex-wrap: wrap;
  margin-left: auto;
  align-self: flex-start;
`;

const RankPageShell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const RankPageBody = styled.div`
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 12px 0 24px;
  box-sizing: border-box;
`;

const StaffOppPool = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const StaffOppPoolToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  text-align: left;
`;

const StaffOppPoolToggleLeading = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const StaffOppSearch = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #d3dae0);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const StaffOppPoolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StaffOppPoolRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-Lighter, #f9f9f9);
`;

const StaffOppPoolTitle = styled.span`
  min-width: 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StaffOppPoolHint = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

function QuestionInput({ question, value, onChange }) {
  const type = question.questionType;
  const options = Array.isArray(question.options) ? question.options : [];

  if (type === "long_text") {
    return (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} />
    );
  }
  if (type === "single_select") {
    return (
      <Dropdown
        selection
        clearable
        options={options.map((o) => ({
          key: o.value || o.label,
          text: o.label || o.value,
          value: o.value || o.label,
        }))}
        value={value || ""}
        onChange={(_, { value: v }) => onChange(v)}
      />
    );
  }
  if (type === "multi_select") {
    return (
      <Dropdown
        selection
        multiple
        options={options.map((o) => ({
          key: o.value || o.label,
          text: o.label || o.value,
          value: o.value || o.label,
        }))}
        value={Array.isArray(value) ? value : []}
        onChange={(_, { value: v }) => onChange(v)}
      />
    );
  }
  if (type === "scale_1_5" || type === "scale_1_10") {
    const max = type === "scale_1_5" ? 5 : 10;
    const scaleOptions = Array.from({ length: max }, (_, i) => ({
      key: i + 1,
      text: `${i + 1}`,
      value: i + 1,
    }));
    return (
      <Dropdown
        selection
        clearable
        options={scaleOptions}
        value={value ?? ""}
        onChange={(_, { value: v }) => onChange(v === "" ? null : v)}
      />
    );
  }
  if (type === "yes_no") {
    return (
      <Dropdown
        selection
        clearable
        options={[
          { key: "yes", text: "Yes", value: true },
          { key: "no", text: "No", value: false },
        ]}
        value={value === true || value === false ? value : ""}
        onChange={(_, { value: v }) => onChange(v === "" ? null : v)}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function RankFormChrome({
  title,
  backLabel,
  onBack,
  backDisabled = false,
  statusChipLabel = null,
  submitted = false,
  submitActions = null,
}) {
  return (
    <RankFormHeader>
      <IconButton
        variant="tonal"
        style={{
          background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
        }}
        ariaLabel={backLabel}
        title={backLabel}
        onClick={onBack}
        disabled={backDisabled}
        icon={
          <img
            src="/assets/icons/back.svg"
            alt=""
            width={12}
            height={12}
            style={{ width: 12, height: 12 }}
          />
        }
      />
      <RankTitleWrap>
        {title ? <h1 title={title}>{title}</h1> : null}
        {statusChipLabel ? (
          <Chip
            variant="static"
            tone={submitted ? "success" : "warning"}
            label={statusChipLabel}
          />
        ) : null}
      </RankTitleWrap>
      {submitActions ? (
        <RankSubmitActions>{submitActions}</RankSubmitActions>
      ) : null}
    </RankFormHeader>
  );
}

export default function StudentPreferenceSubmission({
  roundId,
  user,
  onBack,
  staffForStudent = null,
  onSaved,
  onStaffRefetch,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const locale = router?.locale || "en-us";
  const staffStudentId = staffForStudent?.id || null;
  const isStaffEdit = Boolean(staffStudentId);
  const backLabel = isStaffEdit
    ? t(
        "opportunities.matchingRound.studentRanking.editBallotClose",
        {},
        { default: "Close" },
      )
    : t("opportunities.studentView.rankForm.backLink", {}, {
        default: "Back to opportunities",
      });
  const { data, loading, refetch } = useQuery(GET_PARTICIPATE_VIEW, {
    variables: { roundId },
    fetchPolicy: "cache-and-network",
  });

  const round = data?.connectRound;
  const me = data?.authenticatedItem;
  const assessmentForm = round?.studentAssessmentFormDefinition;
  const assessmentFormId =
    assessmentForm?.status === "published" ? assessmentForm?.id : null;
  const includeAssessment = Boolean(assessmentFormId);
  const stepKeys = buildPreferenceStepKeys(includeAssessment);
  const totalSteps = stepKeys.length;
  const existingPreference = isStaffEdit
    ? staffForStudent?.preference || null
    : me?.connectPreferences?.[0];
  const existingTeamPrefs = isStaffEdit
    ? staffForStudent?.teamPreferences || []
    : me?.teamPreferencesSubmitted || [];
  const existingAnswers = isStaffEdit
    ? staffForStudent?.questionAnswers || []
    : me?.questionAnswers || [];

  const approvedRoundQuestions = (round?.questions || []).filter(
    (q) => q.status === "approved"
  );
  const roundOpportunities = round?.opportunities ?? EMPTY_OPPORTUNITIES;
  const roundOppIdSet = useMemo(
    () => new Set(roundOpportunities.map((o) => o.id).filter(Boolean)),
    [roundOpportunities],
  );
  const submittedEarly = existingPreference?.status === "submitted";
  const isRankingEditable = isStaffEdit
    ? true
    : isRoundRankingEditable(round) && !submittedEarly;
  const isSnapshotLocked = isStaffEdit
    ? false
    : isPreferenceSnapshotLocked({
        preferenceStatus: existingPreference?.status,
        isOpen: isRankingEditable,
      });

  const [roundAnswers, setRoundAnswers] = useState({});
  const [oppAnswers, setOppAnswers] = useState({});
  const [rankings, setRankings] = useState({});
  const [staffBallotOppIds, setStaffBallotOppIds] = useState([]);
  const [staffOppSearch, setStaffOppSearch] = useState("");
  const [staffOppPoolOpen, setStaffOppPoolOpen] = useState(true);
  const [classmateOrder, setClassmateOrder] = useState([]);
  const [notes, setNotes] = useState("");
  const [assessmentData, setAssessmentData] = useState(null);
  const [studentMatchingPreference, setStudentMatchingPreference] =
    useState(null);
  const [matchingPreferenceDraft, setMatchingPreferenceDraft] = useState(null);
  const [editingMatchingPreference, setEditingMatchingPreference] =
    useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentValid, setAssessmentValid] = useState(false);
  const [driftRepairResolved, setDriftRepairResolved] = useState(false);
  const [driftRepairLoading, setDriftRepairLoading] = useState(false);
  const assessmentStepRef = useRef(null);
  const preferenceIdRef = useRef(existingPreference?.id || null);

  const staffBallotOppIdsKey = useMemo(
    () => [...staffBallotOppIds].sort().join(","),
    [staffBallotOppIds],
  );

  const favoriteOppIdsInRound = useMemo(() => {
    if (isStaffEdit) {
      // Staff ballot membership only — do not mirror/mutate student favorites.
      return new Set(staffBallotOppIds);
    }
    return getFavoriteOppIdsInRound(
      me?.favoriteOpportunities ?? user?.favoriteOpportunities,
      roundOppIdSet,
    );
  }, [
    isStaffEdit,
    staffBallotOppIdsKey,
    staffBallotOppIds,
    me?.favoriteOpportunities,
    user?.favoriteOpportunities,
    roundOppIdSet,
  ]);
  const rankingOppIds = useMemo(() => {
    if (isStaffEdit) {
      return new Set(staffBallotOppIds);
    }
    return deriveRankingOpportunityIds({
      favoriteOppIdsInRound,
      existingPreference,
      isSnapshotLocked,
    });
  }, [
    isStaffEdit,
    staffBallotOppIdsKey,
    staffBallotOppIds,
    favoriteOppIdsInRound,
    existingPreference,
    isSnapshotLocked,
  ]);
  const rankingOppIdsKey = useMemo(
    () =>
      isStaffEdit
        ? staffBallotOppIdsKey
        : [...rankingOppIds].sort().join(","),
    [isStaffEdit, staffBallotOppIdsKey, rankingOppIds],
  );
  const opportunities = useMemo(
    () => roundOpportunities.filter((opp) => rankingOppIds.has(opp.id)),
    [roundOpportunities, rankingOppIds],
  );
  const staffSubmitterConnect = useMemo(
    () =>
      isStaffEdit
        ? { submitter: { connect: { id: staffStudentId } } }
        : null,
    [isStaffEdit, staffStudentId],
  );

  const draftDriftEntries = useMemo(
    () =>
      getDraftDriftedOpportunityIds({
        favoriteOppIdsInRound,
        existingPreference,
        isSnapshotLocked,
        localRankings: rankings,
      }),
    [
      favoriteOppIdsInRound,
      existingPreference,
      isSnapshotLocked,
      rankings,
    ],
  );
  const preferenceEntity = useMemo(
    () => ({
      id: existingPreference?.id,
      assessmentData,
    }),
    [existingPreference?.id, assessmentData],
  );

  const teamEligibleOpps = useMemo(() => {
    if (isStaffEdit) {
      return getTeamEligibleOpportunities(roundOpportunities);
    }
    return getStudentTeamEligibleOpportunities(
      roundOpportunities,
      favoriteOppIdsInRound,
    );
  }, [isStaffEdit, roundOpportunities, favoriteOppIdsInRound]);
  const teamEligibleOppIds = useMemo(
    () => teamEligibleOpps.map((o) => o.id).filter(Boolean),
    [teamEligibleOpps],
  );
  const hasTeamOpps = teamEligibleOpps.length > 0;
  const effectivePicks = getMaxActiveClassmatePicks(teamEligibleOpps);
  const largestTeamOpp = getLargestTeamOpportunity(teamEligibleOpps);
  const favoritedTeamProjectsNote = isStaffEdit
    ? null
    : buildFavoritedTeamProjectsNote(teamEligibleOpps, t);

  const networkStudents = (() => {
    const map = new Map();
    const excludeId = isStaffEdit ? staffStudentId : me?.id;
    (round?.classNetwork?.classes || []).forEach((cls) => {
      (cls.students || []).forEach((s) => {
        if (s.id !== excludeId) map.set(s.id, s);
      });
    });
    return Array.from(map.values());
  })();

  useEffect(() => {
    setDriftRepairResolved(false);
  }, [round?.id, existingPreference?.id]);

  useEffect(() => {
    if (isSnapshotLocked) return;
    setRankings((prev) => {
      const next = pruneRankingsToOpportunityIds(prev, rankingOppIds);
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }
      return next;
    });
  }, [rankingOppIdsKey, isSnapshotLocked, rankingOppIds]);

  useEffect(() => {
    if (isStaffEdit) return;
    const raw = router.query.step;
    const stepNum = Number(raw);
    if (raw && stepNum >= 1 && stepNum <= totalSteps) {
      setCurrentStep(stepNum);
    }
  }, [isStaffEdit, router.query.step, totalSteps]);

  const goToStep = useCallback(
    (step) => {
      const next = Math.min(totalSteps, Math.max(1, step));
      setCurrentStep(next);
      if (!isStaffEdit && router.query.round) {
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, step: String(next) },
          },
          undefined,
          { shallow: true },
        );
      }
    },
    [isStaffEdit, router, totalSteps],
  );

  useEffect(() => {
    if (!round) return;
    const rA = {};
    const oA = {};
    existingAnswers.forEach((a) => {
      const oppId = a.opportunity?.id;
      if (oppId) {
        if (!oA[oppId]) oA[oppId] = {};
        oA[oppId][a.question.id] = a.answer;
      } else if (a.question?.id) {
        rA[a.question.id] = a.answer;
      }
    });
    setRoundAnswers(rA);
    setOppAnswers(oA);

    const r = {};
    const staffItemIds = [];
    const preferenceItems = [...(existingPreference?.items || [])].sort(
      (a, b) => Number(a.rank || 0) - Number(b.rank || 0),
    );
    preferenceItems.forEach((item) => {
      if (!item.opportunity?.id) return;
      if (
        !isStaffEdit &&
        !isSnapshotLocked &&
        !favoriteOppIdsInRound.has(item.opportunity.id)
      ) {
        return;
      }
      staffItemIds.push(item.opportunity.id);
      r[item.opportunity.id] = {
        rank: item.rank ?? "",
        starRating: item.starRating ?? "",
        comment: item.comment || "",
      };
    });
    setRankings(r);
    if (isStaffEdit) {
      setStaffBallotOppIds(staffItemIds);
      setStaffOppSearch("");
    }

    setClassmateOrder(
      deriveClassmateOrder(existingTeamPrefs, teamEligibleOppIds),
    );

    setNotes(existingPreference?.notes || "");
    setAssessmentData((prev) => {
      const incoming = existingPreference?.assessmentData || null;
      if (isAssessmentDataEntries(prev) && !isAssessmentDataEntries(incoming)) {
        return prev;
      }
      return incoming;
    });
    const savedMatching = existingPreference?.studentMatchingPreference || null;
    setStudentMatchingPreference(savedMatching);
    setMatchingPreferenceDraft(getMatchingQueue(savedMatching));
    setEditingMatchingPreference(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    round?.id,
    existingPreference?.id,
    teamEligibleOppIds.join(","),
    isSnapshotLocked,
    isStaffEdit,
    // Student favorites membership can change without a preference id change.
    // Staff ballot ids are seeded from preference items above — do not depend on them.
    isStaffEdit ? "" : rankingOppIdsKey,
  ]);

  const [createPreference] = useMutation(CREATE_PREFERENCE);
  const [updatePreference] = useMutation(UPDATE_PREFERENCE);
  const [deletePreferenceItems] = useMutation(DELETE_PREFERENCE_ITEMS);
  const [deleteTeamPreferences] = useMutation(DELETE_TEAM_PREFERENCES);
  const [createTeamPreferences] = useMutation(CREATE_TEAM_PREFERENCES);
  const [deleteQuestionAnswers] = useMutation(DELETE_QUESTION_ANSWERS);
  const [createQuestionAnswers] = useMutation(CREATE_QUESTION_ANSWERS);
  const [createRating] = useMutation(CREATE_RATING);
  const [updateRating] = useMutation(UPDATE_RATING);
  const [restoreFavorites] = useMutation(TOGGLE_FAVORITE_OPPORTUNITY, {
    refetchQueries: [
      { query: CURRENT_USER_QUERY },
      { query: GET_PARTICIPATE_VIEW, variables: { roundId } },
    ],
    awaitRefetchQueries: true,
  });

  const [saving, setSaving] = useState(false);
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [savingRatingId, setSavingRatingId] = useState(null);
  const [formSaveFeedback, setFormSaveFeedback] = useState(null);
  const [assessmentSaveFeedback, setAssessmentSaveFeedback] = useState(null);

  useEffect(() => {
    if (existingPreference?.id) {
      preferenceIdRef.current = existingPreference.id;
    }
  }, [existingPreference?.id]);

  const setScopedSaveFeedback = (scope, feedback) => {
    if (scope === "assessment") {
      setAssessmentSaveFeedback(feedback);
      return;
    }
    setFormSaveFeedback(feedback);
  };

  const clearFormSaveFeedback = () => setFormSaveFeedback(null);
  const clearAssessmentSaveFeedback = () => setAssessmentSaveFeedback(null);

  const updateRankings = (updater) => {
    setRankings((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  };

  const updateOppAnswer = (oppId, questionId, value) => {
    setOppAnswers((prev) => ({
      ...prev,
      [oppId]: { ...(prev[oppId] || {}), [questionId]: value },
    }));
  };

  const handleSave = async (targetStatus, options = {}) => {
    const { assessmentDataOverride, feedbackScope: feedbackScopeOption } =
      options;
    if (!round) return false;

    const feedbackScope =
      feedbackScopeOption ||
      (assessmentDataOverride !== undefined && assessmentDataOverride !== null
        ? "assessment"
        : "form");

    const nextAssessmentData = assessmentDataOverride ?? assessmentData;
    const nextMatchingPreference =
      options.studentMatchingPreferenceOverride ?? studentMatchingPreference;

    if (targetStatus === "submitted") {
      if (
        includeAssessment &&
        assessmentFormId &&
        !isAssessmentFormAnswerComplete(nextAssessmentData, assessmentFormId)
      ) {
        setScopedSaveFeedback(feedbackScope, {
          variant: "warning",
          message: t(
            "opportunities.studentView.rankForm.assessmentRequired",
            {},
            {
              default:
                "Complete the Individual Core Competency Assessment before submitting.",
            },
          ),
        });
        return false;
      }

      if (!getMatchingQueue(nextMatchingPreference)) {
        setScopedSaveFeedback("form", {
          variant: "warning",
          message: t(
            "opportunities.studentView.rankForm.matchingPreference.required",
            {},
            {
              default:
                "Choose Team first or Project first before ranking classmates or opportunities.",
            },
          ),
        });
        return false;
      }

      if (!hasRankedPreferenceItems(rankings)) {
        setScopedSaveFeedback("form", {
          variant: "warning",
          message: t(
            "opportunities.studentView.rankForm.steps.needRankedOpportunity",
            {},
            {
              default:
                "Favorite and rank at least one opportunity before continuing.",
            },
          ),
        });
        return false;
      }
    }

    // Validation: when submitting (not drafting), enforce required questions.
    if (PREFERENCE_QUESTIONS_ENABLED && targetStatus === "submitted") {
      const missing = [];

      // Required round-level questions must have an answer.
      approvedRoundQuestions
        .filter((q) => q.isRequired)
        .forEach((q) => {
          const ans = roundAnswers[q.id];
          const empty =
            ans === undefined ||
            ans === null ||
            ans === "" ||
            (Array.isArray(ans) && ans.length === 0);
          if (empty) missing.push(`Round question: "${q.prompt}"`);
        });

      // Required opportunity-level questions must be answered ONLY for opps
      // the student is actually ranking (rank or star set).
      opportunities.forEach((opp) => {
        const r = rankings[opp.id] || {};
        const isRankingThis =
          r.rank !== "" && r.rank !== undefined && r.rank !== null;
        const isStarringThis =
          r.starRating !== "" &&
          r.starRating !== undefined &&
          r.starRating !== null;
        if (!isRankingThis && !isStarringThis) return;
        (opp.questions || [])
          .filter((q) => q.status === "approved" && q.isRequired)
          .forEach((q) => {
            const ans = (oppAnswers[opp.id] || {})[q.id];
            const empty =
              ans === undefined ||
              ans === null ||
              ans === "" ||
              (Array.isArray(ans) && ans.length === 0);
            if (empty)
              missing.push(`"${opp.title}" question: "${q.prompt}"`);
          });
      });

      if (missing.length > 0) {
        setScopedSaveFeedback("form", {
          variant: "warning",
          message: t(
            "opportunities.studentView.rankForm.requiredQuestions",
            { count: missing.length },
            {
              default:
                "Answer all required questions before submitting ({{count}} remaining).",
            },
          ),
        });
        return false;
      }
    }

    setScopedSaveFeedback(feedbackScope, null);
    setSaving(true);
    try {
      // 1) Build items from rankings
      const items = filterRankingEntriesForSave(rankings, rankingOppIds, {
        isSnapshotLocked,
      }).map(([oppId, r]) => ({
        opportunity: { connect: { id: oppId } },
        rank: r.rank === "" ? null : Number(r.rank),
        starRating: r.starRating === "" ? null : Number(r.starRating),
        comment: r.comment || "",
      }));

      // 2) Wipe existing items, then upsert preference with new items
      if (existingPreference?.items?.length) {
        await deletePreferenceItems({
          variables: {
            where: existingPreference.items.map((i) => ({ id: i.id })),
          },
        });
      }

      const submittedAt =
        targetStatus === "submitted" ? new Date().toISOString() : null;

      const preferenceId = existingPreference?.id || preferenceIdRef.current;

      if (preferenceId) {
        await updatePreference({
          variables: {
            id: preferenceId,
            input: {
              status: targetStatus,
              notes,
              submittedAt,
              assessmentData: nextAssessmentData,
              studentMatchingPreference: nextMatchingPreference,
              items: items.length ? { create: items } : undefined,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        const created = await createPreference({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              role: "student",
              status: targetStatus,
              notes,
              submittedAt,
              assessmentData: nextAssessmentData,
              studentMatchingPreference: nextMatchingPreference,
              items: items.length ? { create: items } : undefined,
              ...(staffSubmitterConnect || {}),
            },
          },
        });
        const createdId = created?.data?.createConnectPreference?.id;
        if (createdId) preferenceIdRef.current = createdId;
      }

      if (assessmentDataOverride) {
        setAssessmentData(nextAssessmentData);
      }
      if (options.studentMatchingPreferenceOverride) {
        setStudentMatchingPreference(nextMatchingPreference);
        setMatchingPreferenceDraft(getMatchingQueue(nextMatchingPreference));
        setEditingMatchingPreference(false);
      }

      // 3) Wipe + recreate question answers (deferred while questions UI is hidden)
      if (PREFERENCE_QUESTIONS_ENABLED) {
        if (existingAnswers.length) {
          await deleteQuestionAnswers({
            variables: { where: existingAnswers.map((a) => ({ id: a.id })) },
          });
        }
        const newAnswers = [];
        Object.entries(roundAnswers).forEach(([qId, ans]) => {
          if (ans === undefined || ans === null || ans === "") return;
          newAnswers.push({
            question: { connect: { id: qId } },
            round: { connect: { id: round.id } },
            answer: ans,
          });
        });
        Object.entries(oppAnswers).forEach(([oppId, qMap]) => {
          Object.entries(qMap).forEach(([qId, ans]) => {
            if (ans === undefined || ans === null || ans === "") return;
            newAnswers.push({
              question: { connect: { id: qId } },
              round: { connect: { id: round.id } },
              opportunity: { connect: { id: oppId } },
              answer: ans,
            });
          });
        });
        if (newAnswers.length) {
          await createQuestionAnswers({ variables: { data: newAnswers } });
        }
      }

      // 4) Wipe + recreate team preferences (class-wide order fan-out)
      if (existingTeamPrefs.length) {
        await deleteTeamPreferences({
          variables: {
            where: existingTeamPrefs.map((t) => ({ id: t.id })),
          },
        });
      }
      const newTeamPrefs = [];
      teamEligibleOpps.forEach((opp) => {
        classmateOrder.forEach((tmId, idx) => {
          newTeamPrefs.push({
            round: { connect: { id: round.id } },
            opportunity: { connect: { id: opp.id } },
            preferredTeammate: { connect: { id: tmId } },
            priority: idx + 1,
            ...(staffSubmitterConnect || {}),
          });
        });
      });
      if (newTeamPrefs.length) {
        await createTeamPreferences({ variables: { data: newTeamPrefs } });
      }

      await refetch();

      if (
        isStaffEdit &&
        typeof onStaffRefetch === "function"
      ) {
        await onStaffRefetch();
      }

      if (!options.skipSuccessFeedback) {
        if (targetStatus === "submitted") {
          setScopedSaveFeedback("form", {
            variant: "success",
            message: isStaffEdit
              ? t(
                  "opportunities.matchingRound.studentRanking.editBallotSubmitSuccess",
                  {},
                  { default: "Student ballot saved." },
                )
              : t(
                  "opportunities.studentView.rankForm.submitSuccess",
                  {},
                  { default: "Your preferences were submitted." },
                ),
          });
        } else if (feedbackScope === "assessment") {
          setScopedSaveFeedback("assessment", {
            variant: "success",
            message: t(
              "opportunities.studentView.rankForm.assessmentSaveSuccess",
              {},
              { default: "Your assessment answers were saved." },
            ),
          });
        } else {
          setScopedSaveFeedback("form", {
            variant: "success",
            message: isStaffEdit
              ? t(
                  "opportunities.matchingRound.studentRanking.editBallotDraftSuccess",
                  {},
                  { default: "Student ballot progress saved." },
                )
              : t(
                  "opportunities.studentView.rankForm.draftSaveSuccess",
                  {},
                  { default: "Your progress was saved." },
                ),
          });
        }
      }
      if (
        isStaffEdit &&
        targetStatus === "submitted" &&
        typeof onSaved === "function"
      ) {
        onSaved();
      }
      return true;
    } catch (error) {
      console.error("Failed to save student preferences", error);
      setScopedSaveFeedback(feedbackScope, {
        variant: "warning",
        message: t(
          "opportunities.studentView.rankForm.saveFailed",
          {},
          {
            default: "Could not save your progress. Please try again.",
          },
        ),
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  const handleSaveRating = async (match) => {
    const draft = ratingDrafts[match.id] || {};
    const myExistingRating = (match.ratings || []).find(
      (r) => r.raterRole === "student" && r.rater?.id === me?.id
    );
    const opportunityRating =
      draft.opportunityRating === undefined
        ? myExistingRating?.opportunityRating ?? null
        : Number(draft.opportunityRating);
    const feedback =
      draft.feedback === undefined
        ? myExistingRating?.feedback || ""
        : draft.feedback;
    const isPublic =
      draft.isPublic === undefined
        ? !!myExistingRating?.isPublic
        : !!draft.isPublic;
    const teammateRatings =
      draft.teammateRatings === undefined
        ? myExistingRating?.teammateRatings || null
        : draft.teammateRatings;

    if (!opportunityRating) {
      setFormSaveFeedback({
        variant: "warning",
        message: t("opportunities.studentView.rankForm.ratingRequired", {}, {
          default: "Pick a star rating before saving.",
        }),
      });
      return;
    }
    setFormSaveFeedback(null);
    setSavingRatingId(match.id);
    try {
      if (myExistingRating) {
        await updateRating({
          variables: {
            id: myExistingRating.id,
            input: {
              opportunityRating,
              feedback,
              isPublic,
              teammateRatings,
            },
          },
        });
      } else {
        await createRating({
          variables: {
            input: {
              match: { connect: { id: match.id } },
              opportunity: match.opportunity?.id
                ? { connect: { id: match.opportunity.id } }
                : undefined,
              raterRole: "student",
              opportunityRating,
              feedback,
              isPublic,
              teammateRatings,
            },
          },
        });
      }
      await refetch();
      setRatingDrafts((prev) => ({ ...prev, [match.id]: {} }));
      setFormSaveFeedback({
        variant: "success",
        message: t("opportunities.studentView.rankForm.ratingSaveSuccess", {}, {
          default: "Your rating was saved.",
        }),
      });
    } catch (error) {
      console.error("Failed to save match rating", error);
      setFormSaveFeedback({
        variant: "warning",
        message: t("opportunities.studentView.rankForm.saveFailed", {}, {
          default: "Could not save your progress. Please try again.",
        }),
      });
    } finally {
      setSavingRatingId(null);
    }
  };

  const staffPoolOpportunities = useMemo(() => {
    if (!isStaffEdit) return [];
    const inBallot = new Set(staffBallotOppIds);
    const query = staffOppSearch.trim().toLowerCase();
    return roundOpportunities
      .filter((opp) => opp?.id && !inBallot.has(opp.id))
      .filter((opp) => {
        if (!query) return true;
        const hay = [opp.title, formatOpportunitySponsorLabel(opp)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [isStaffEdit, staffBallotOppIds, staffOppSearch, roundOpportunities]);

  const handleStaffAddOpportunity = useCallback((oppId) => {
    if (!oppId) return;
    setStaffBallotOppIds((prev) =>
      prev.includes(oppId) ? prev : [...prev, oppId],
    );
    setRankings((prev) => {
      if (prev[oppId]) return prev;
      const nextRank =
        Object.values(prev).reduce((max, entry) => {
          const rank = Number(entry?.rank);
          return Number.isFinite(rank) ? Math.max(max, rank) : max;
        }, 0) + 1;
      return {
        ...prev,
        [oppId]: { rank: nextRank, starRating: "", comment: "" },
      };
    });
  }, []);

  const handleStaffRemoveOpportunity = useCallback((oppId) => {
    if (!oppId) return;
    setStaffBallotOppIds((prev) => prev.filter((id) => id !== oppId));
    setRankings((prev) => {
      const next = { ...prev };
      delete next[oppId];
      return pruneRankingsToOpportunityIds(next, Object.keys(next));
    });
  }, []);

  if (loading && !round) {
    return (
      <RankPageShell>
        <RankFormChrome backLabel={backLabel} onBack={handleCancel} />
        <RankPageBody>
          <MessageCard
            variant="information"
            message={t("opportunities.studentView.rankForm.loading", {}, {
              default: "Loading round…",
            })}
          />
        </RankPageBody>
      </RankPageShell>
    );
  }
  if (!round) {
    return (
      <RankPageShell>
        <RankFormChrome backLabel={backLabel} onBack={handleCancel} />
        <RankPageBody>
          <MessageCard
            variant="neutral"
            message={t("opportunities.studentView.rankForm.notFound", {}, {
              default: "Round not found.",
            })}
          />
        </RankPageBody>
      </RankPageShell>
    );
  }

  if (round.status === "draft") {
    const draftTitle = round.title || "";
    return (
      <RankPageShell>
        <RankFormChrome
          title={draftTitle}
          backLabel={backLabel}
          onBack={handleCancel}
        />
        <RankPageBody>
          <Card>
            <p className="helper">
              {t("opportunities.studentView.rankForm.notAvailableYet", {}, {
                default:
                  "This round is not available yet. Your teacher is still setting it up.",
              })}
            </p>
          </Card>
        </RankPageBody>
      </RankPageShell>
    );
  }

  const now = Date.now();
  const { beforeOpen, afterClose } = getPreferenceTimeWindowState(round, now);
  const preferenceIsSubmitted = existingPreference?.status === "submitted";
  // Staff edit stays unlocked even when the ballot is already submitted.
  const submitted = isStaffEdit ? false : submittedEarly;
  const isOpen = isStaffEdit ? true : isRankingEditable;
  const showDriftRepairModal =
    !isStaffEdit &&
    isRankingEditable &&
    draftDriftEntries.length > 0 &&
    !driftRepairResolved;

  const handleRestoreDriftFavorites = async () => {
    if (!me?.id || !draftDriftEntries.length) return;
    setDriftRepairLoading(true);
    try {
      await restoreFavorites({
        variables: {
          profileId: me.id,
          input: {
            favoriteOpportunities: {
              connect: draftDriftEntries.map((entry) => ({ id: entry.oppId })),
            },
          },
        },
      });
      setDriftRepairResolved(true);
      await refetch();
    } catch (error) {
      console.error("Failed to restore drift favorites", error);
      setScopedSaveFeedback("form", {
        variant: "warning",
        message: t("opportunities.studentView.rankForm.saveFailed", {}, {
          default: "Could not save your progress. Please try again.",
        }),
      });
    } finally {
      setDriftRepairLoading(false);
    }
  };

  const handleRemoveDriftFromDraft = async () => {
    if (!draftDriftEntries.length) return;
    setDriftRepairLoading(true);
    try {
      const itemIds = draftDriftEntries
        .map((entry) => entry.itemId)
        .filter(Boolean);
      if (itemIds.length) {
        await deletePreferenceItems({
          variables: {
            where: itemIds.map((id) => ({ id })),
          },
        });
      }
      setRankings((prev) =>
        pruneRankingsToOpportunityIds(prev, favoriteOppIdsInRound),
      );
      setDriftRepairResolved(true);
      await refetch();
    } catch (error) {
      console.error("Failed to remove drifted draft ranking items", error);
      setScopedSaveFeedback("form", {
        variant: "warning",
        message: t("opportunities.studentView.rankForm.saveFailed", {}, {
          default: "Could not save your progress. Please try again.",
        }),
      });
    } finally {
      setDriftRepairLoading(false);
    }
  };

  let lockReason = null;
  if (!isStaffEdit) {
    if (round.status === "draft") {
      lockReason = t("opportunities.studentView.rankForm.notAvailableYet", {}, {
        default:
          "This round is not available yet. Your teacher is still setting it up.",
      });
    } else if (round.status !== "preferences_open") {
      lockReason = t(
        "opportunities.studentView.rankForm.lockReason.roundClosed",
        { status: round.status.replace(/_/g, " ") },
        {
          default:
            "Preferences are {{status}} for this round. You can review what you submitted, but changes are no longer accepted.",
        },
      );
    } else if (beforeOpen) {
      const timeZone = readPreferenceWindowTimeZone(round.settings);
      const openMs = resolvePreferenceWindowInstantMs(
        round.openAt,
        "open",
        timeZone,
      );
      const openDate =
        openMs != null
          ? formatPreferenceWindowInstant(
              new Date(openMs).toISOString(),
              timeZone,
            )
          : "";
      lockReason = t(
        "opportunities.studentView.rankForm.lockReason.beforeOpen",
        { date: openDate },
        {
          default:
            "This round opens on {{date}}. Come back then to submit your preferences.",
        },
      );
    } else if (afterClose) {
      const timeZone = readPreferenceWindowTimeZone(round.settings);
      const closeMs = resolvePreferenceWindowInstantMs(
        round.closeAt,
        "close",
        timeZone,
      );
      const closeDate =
        closeMs != null
          ? formatPreferenceWindowInstant(
              new Date(closeMs).toISOString(),
              timeZone,
            )
          : "";
      lockReason = t(
        "opportunities.studentView.rankForm.lockReason.afterClose",
        { date: closeDate },
        {
          default:
            "Preferences closed on {{date}}. You can review what you submitted, but changes are no longer accepted.",
        },
      );
    } else if (submitted) {
      const when = existingPreference?.submittedAt
        ? new Date(existingPreference.submittedAt).toLocaleString()
        : t("opportunities.studentView.rankForm.lockReason.submittedEarlier", {}, {
            default: "earlier",
          });
      lockReason = t(
        "opportunities.studentView.rankForm.lockReason.submitted",
        { when },
        {
          default:
            "You submitted your preferences {{when}}. Need to change something? Ask your teacher — they can reopen your submission.",
        },
      );
    }
  }

  const pageTitle = round.title || "";
  const statusChipLabel = existingPreference
    ? preferenceIsSubmitted
      ? t("opportunities.studentView.rankForm.statusSubmitted", {}, {
          default: "Submitted",
        })
      : t("opportunities.studentView.rankForm.statusDraft", {}, {
          default: "Draft saved",
        })
    : null;

  // Editable ranking with round opportunities available, but nothing favorited yet
  // (covers both first entry before a draft exists, and an existing draft).
  // Submitted/closed rankings stay reviewable; drift repair takes precedence.
  // Staff edit uses all round opportunities — skip the student favorites gate.
  const showEmptyFavoritesZeroState =
    !isStaffEdit &&
    isOpen &&
    !submitted &&
    favoriteOppIdsInRound.size === 0 &&
    roundOpportunities.length > 0 &&
    !showDriftRepairModal;

  if (showEmptyFavoritesZeroState) {
    return (
      <RankPageShell>
        <RankFormChrome
          title={pageTitle}
          backLabel={backLabel}
          onBack={handleCancel}
          statusChipLabel={statusChipLabel}
          submitted={submitted}
        />
        <RankPageBody>
          <Card>
            <h2>
              {t(
                "opportunities.studentView.rankForm.emptyFavoritesTitle",
                {},
                { default: "No favorited opportunities yet" },
              )}
            </h2>
            <p className="helper">
              {t(
                "opportunities.studentView.rankForm.emptyFavoritesHint",
                {},
                {
                  default:
                    "Go back and tap the star on the opportunities you want to rank.",
                },
              )}
            </p>
            <Button type="button" variant="filled" onClick={handleCancel}>
              {t(
                "opportunities.studentView.rankForm.addFavorites",
                {},
                { default: "Add favorites" },
              )}
            </Button>
          </Card>
        </RankPageBody>
      </RankPageShell>
    );
  }

  const handleSaveDraft = async () => {
    const stepKey = stepKeys[currentStep - 1] || stepKeys[0];
    if (
      stepKey === "assessment" &&
      typeof assessmentStepRef.current?.save === "function"
    ) {
      return assessmentStepRef.current.save({
        skipValidation: true,
        feedbackScope: "form",
      });
    }
    return handleSave("draft");
  };
  const handleSubmitPreferences = async () => {
    if (includeAssessment) {
      const assessmentStep = stepKeys.indexOf("assessment") + 1;
      const saved = await assessmentStepRef.current?.save?.({
        skipValidation: false,
        feedbackScope: "form",
        skipSuccessFeedback: true,
      });
      if (saved === false || saved == null) {
        if (assessmentStep >= 1) goToStep(assessmentStep);
        return false;
      }
      const assessmentDataOverride = saved === true ? assessmentData : saved;
      return handleSave("submitted", {
        assessmentDataOverride,
        feedbackScope: "form",
      });
    }
    return handleSave("submitted");
  };

  const persistAssessmentDraft = async (
    nextAssessmentData,
    { manageSaving = true } = {},
  ) => {
    if (!round) return false;
    if (manageSaving) setSaving(true);
    try {
      const preferenceId = existingPreference?.id || preferenceIdRef.current;
      if (preferenceId) {
        await updatePreference({
          variables: {
            id: preferenceId,
            input: {
              assessmentData: nextAssessmentData,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        const created = await createPreference({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              role: "student",
              status: "draft",
              assessmentData: nextAssessmentData,
              ...(staffSubmitterConnect || {}),
            },
          },
        });
        const createdId = created?.data?.createConnectPreference?.id;
        if (createdId) preferenceIdRef.current = createdId;
      }
      setAssessmentData(nextAssessmentData);
      if (isStaffEdit && typeof onStaffRefetch === "function") {
        await onStaffRefetch();
      }
      return true;
    } catch (error) {
      console.error("Failed to save student assessment", error);
      setScopedSaveFeedback("form", {
        variant: "warning",
        message: t(
          "opportunities.studentView.rankForm.saveFailed",
          {},
          {
            default: "Could not save your progress. Please try again.",
          },
        ),
      });
      return false;
    } finally {
      if (manageSaving) setSaving(false);
    }
  };

  const handleSaveAssessment = async (nextAssessmentData, options = {}) => {
    if (options.skipSuccessFeedback) {
      return persistAssessmentDraft(nextAssessmentData, {
        manageSaving: options.manageSaving !== false,
      });
    }
    return handleSave("draft", {
      assessmentDataOverride: nextAssessmentData,
      feedbackScope: options.feedbackScope || "assessment",
    });
  };

  const handleSaveMatchingPreference = async (queue) => {
    if (!round || !queue) return false;
    const next = buildStudentMatchingPreference(queue);
    setSaving(true);
    try {
      let nextAssessmentData = assessmentData;
      if (includeAssessment && typeof assessmentStepRef.current?.save === "function") {
        const saved = await assessmentStepRef.current.save({
          skipValidation: true,
          skipSuccessFeedback: true,
          manageSaving: false,
          feedbackScope: "assessment",
        });
        if (saved !== false && saved != null && saved !== true) {
          nextAssessmentData = saved;
        }
      }

      const preferenceId = existingPreference?.id || preferenceIdRef.current;
      if (preferenceId) {
        await updatePreference({
          variables: {
            id: preferenceId,
            input: {
              studentMatchingPreference: next,
              ...(nextAssessmentData != null
                ? { assessmentData: nextAssessmentData }
                : {}),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        const created = await createPreference({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              role: "student",
              status: "draft",
              studentMatchingPreference: next,
              assessmentData: nextAssessmentData,
              ...(staffSubmitterConnect || {}),
            },
          },
        });
        const createdId = created?.data?.createConnectPreference?.id;
        if (createdId) preferenceIdRef.current = createdId;
      }
      setStudentMatchingPreference(next);
      setMatchingPreferenceDraft(queue);
      setEditingMatchingPreference(false);
      if (nextAssessmentData != null) {
        setAssessmentData(nextAssessmentData);
      }
      await refetch();
      if (isStaffEdit && typeof onStaffRefetch === "function") {
        await onStaffRefetch();
      }
      return true;
    } catch (error) {
      console.error("Failed to save matching preference", error);
      setScopedSaveFeedback("form", {
        variant: "warning",
        message: t(
          "opportunities.studentView.rankForm.saveFailed",
          {},
          {
            default: "Could not save your progress. Please try again.",
          },
        ),
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const currentStepKey = stepKeys[currentStep - 1] || stepKeys[0];
  const savedMatchingQueue = getMatchingQueue(studentMatchingPreference);
  const rankingEnabled =
    isOpen &&
    !showDriftRepairModal &&
    (isStaffEdit || Boolean(savedMatchingQueue));

  const matchingPreferenceCard = (
    <StudentMatchingPreferenceCard
      tab={currentStepKey === "opportunities" ? "opportunities" : "classmates"}
      selectedQueue={matchingPreferenceDraft}
      onSelect={setMatchingPreferenceDraft}
      savedQueue={savedMatchingQueue}
      isEditing={editingMatchingPreference}
      isOpen={isOpen}
      saving={saving}
      onConfirm={handleSaveMatchingPreference}
      onStartChange={() => setEditingMatchingPreference(true)}
    />
  );

  const savingLabel = t("opportunities.studentView.rankForm.saving", {}, {
    default: "Saving…",
  });
  const submitDisabledHint = t(
    "opportunities.studentView.rankForm.submitDisabledHint",
    {},
    {
      default:
        "Answer all required fields on every tab before submitting.",
    },
  );
  const canSubmitPreferences =
    !saving &&
    (!includeAssessment || assessmentValid) &&
    Boolean(savedMatchingQueue) &&
    hasRankedPreferenceItems(rankings);
  const headerSubmitActions = isOpen ? (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleSaveDraft}
        disabled={saving}
      >
        {saving
          ? savingLabel
          : t("opportunities.studentView.rankForm.steps.saveStep", {}, {
              default: "Save progress",
            })}
      </Button>
      <Button
        type="button"
        variant="filled"
        onClick={handleSubmitPreferences}
        disabled={!canSubmitPreferences}
        title={!canSubmitPreferences && !saving ? submitDisabledHint : undefined}
        aria-label={
          !canSubmitPreferences && !saving
            ? submitDisabledHint
            : undefined
        }
      >
        {saving
          ? savingLabel
          : t("opportunities.studentView.rankForm.submit", {}, {
              default: "Submit preferences",
            })}
      </Button>
    </>
  ) : null;

  return (
    <RankPageShell>
      <RankFormChrome
        title={pageTitle}
        backLabel={backLabel}
        onBack={handleCancel}
        backDisabled={saving}
        statusChipLabel={statusChipLabel}
        submitted={preferenceIsSubmitted}
        submitActions={headerSubmitActions}
      />
      <RankPageBody>
      {isStaffEdit ? (
        <MessageCard
          variant="information"
          message={t(
            "opportunities.matchingRound.studentRanking.editBallotHelper",
            {},
            {
              default:
                "You are editing this ballot on behalf of the student. Saving does not reopen the round for them.",
            },
          )}
        />
      ) : null}
      {formSaveFeedback ? (
        <MessageCard
          variant={formSaveFeedback.variant}
          message={formSaveFeedback.message}
          onClose={clearFormSaveFeedback}
          closeAriaLabel={t(
            "opportunities.matchingRound.formWizard.bannerDismiss",
            {},
            { default: "Dismiss" },
          )}
        />
      ) : null}

      {!isOpen && lockReason ? (
        <MessageCard variant="information" message={lockReason} />
      ) : null}

      {!isStaffEdit
        ? (me?.connectMatches || [])
            .filter((m) => m.status !== "proposed" || round.status === "published")
            .map((match) => {
          const opp = match.opportunity;
          const mentorName = formatOpportunitySponsorLabel(opp);
          const myExistingRating = (match.ratings || []).find(
            (r) => r.raterRole === "student" && r.rater?.id === me?.id
          );
          const draft = ratingDrafts[match.id] || {};
          const stars =
            draft.opportunityRating ??
            myExistingRating?.opportunityRating ??
            0;
          const feedback =
            draft.feedback ?? myExistingRating?.feedback ?? "";
          const isPublic =
            draft.isPublic ?? myExistingRating?.isPublic ?? false;
          const teammateRatings =
            draft.teammateRatings ??
            myExistingRating?.teammateRatings ??
            {};
          // Other students matched to the same opportunity (excluding me)
          const teammates = (opp?.matches || [])
            .map((m) => m.student)
            .filter((s) => s?.id && s.id !== me?.id);
          const showTeammateSection =
            (opp?.teamSize || 1) > 1 &&
            teammates.length > 0 &&
            match.status !== "proposed";
          return (
            <Card key={match.id}>
              <h2>Your match</h2>
              <p className="helper">
                You&apos;ve been matched to this opportunity for the round.
              </p>
              <div
                style={{
                  padding: 16,
                  border: "1px solid #d3dae0",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  className="MH-Type-Title-Base"
                  style={{
                    color: "#171717",
                  }}
                >
                  {opp?.title || "(opportunity)"}
                </div>
                <div
                  className="MH-Type-Body-Base"
                  style={{ color: "#5f6871" }}
                >
                  By {mentorName} ·{" "}
                  <Chip
                    variant="static"
                    tone={match.status === "active" ? "success" : "warning"}
                    label={match.status}
                  />
                </div>
                {opp?.shortDescription && (
                  <p
                    className="MH-Type-Body-Base"
                    style={{ margin: 0, color: "#5f6871" }}
                  >
                    {opp.shortDescription}
                  </p>
                )}
              </div>

              {match.status !== "proposed" && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 16,
                    border: "1px dashed #d3dae0",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <strong style={{ color: "#171717" }}>
                    {myExistingRating ? "Update your rating" : "Rate this experience"}
                  </strong>
                  <Field>
                    <span className="label-text">Stars (1-5)</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [match.id]: {
                                ...(prev[match.id] || {}),
                                opportunityRating: n,
                              },
                            }))
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 24,
                            color: n <= stars ? "#f5b800" : "#d3dae0",
                            padding: 0,
                          }}
                        >
                          {n <= stars ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field>
                    <span className="label-text">Feedback</span>
                    <textarea
                      value={feedback}
                      onChange={(e) =>
                        setRatingDrafts((prev) => ({
                          ...prev,
                          [match.id]: {
                            ...(prev[match.id] || {}),
                            feedback: e.target.value,
                          },
                        }))
                      }
                      placeholder="What did you learn? What worked? What could improve?"
                    />
                  </Field>
                  <label
                    className="MH-Type-Label-Base"
                    style={{
                      display: "inline-flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) =>
                        setRatingDrafts((prev) => ({
                          ...prev,
                          [match.id]: {
                            ...(prev[match.id] || {}),
                            isPublic: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Show this rating publicly on the opportunity page</span>
                  </label>
                  {showTeammateSection && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        borderRadius: 12,
                        background: "#f7f9f8",
                        border: "1px solid #d3dae0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <strong
                        className="MH-Type-Title-Small"
                        style={{ color: "#171717" }}
                      >
                        Rate your teammates
                      </strong>
                      <span className="helper">
                        Only the teacher sees individual teammate ratings.
                        Helpful for understanding how the team worked together.
                      </span>
                      {teammates.map((t) => {
                        const tName =
                          `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
                          t.username;
                        const tEntry =
                          (teammateRatings && teammateRatings[t.id]) || {};
                        const tStars = tEntry.rating || 0;
                        const tComment = tEntry.comment || "";
                        const setTeammate = (changes) =>
                          setRatingDrafts((prev) => {
                            const prevDraft = prev[match.id] || {};
                            const prevTm =
                              prevDraft.teammateRatings ??
                              myExistingRating?.teammateRatings ??
                              {};
                            return {
                              ...prev,
                              [match.id]: {
                                ...prevDraft,
                                teammateRatings: {
                                  ...prevTm,
                                  [t.id]: {
                                    ...(prevTm[t.id] || {}),
                                    ...changes,
                                  },
                                },
                              },
                            };
                          });
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              padding: 10,
                              borderRadius: 10,
                              background: "#ffffff",
                              border: "1px solid #eef1f2",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <strong
                                className="MH-Type-Title-Small"
                                style={{ color: "#171717" }}
                              >
                                {tName}
                              </strong>
                              <div style={{ display: "flex", gap: 2 }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setTeammate({ rating: n })}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 18,
                                      color:
                                        n <= tStars ? "#f5b800" : "#d3dae0",
                                      padding: 0,
                                    }}
                                  >
                                    {n <= tStars ? "★" : "☆"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={tComment}
                              placeholder="Optional note (private)"
                              onChange={(e) =>
                                setTeammate({ comment: e.target.value })
                              }
                              style={{
                                padding: "6px 10px",
                                border: "1px solid #d3dae0",
                                borderRadius: 8,
                                font: 'var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif)',
                                letterSpacing: 0,
                                outline: "none",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="filled"
                      onClick={() => handleSaveRating(match)}
                      disabled={savingRatingId === match.id}
                    >
                      {savingRatingId === match.id
                        ? t("opportunities.studentView.rankForm.saving", {}, {
                            default: "Saving…",
                          })
                        : myExistingRating
                        ? "Update rating"
                        : "Submit rating"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })
        : null}

      <Card>
        <PreferenceSubmissionStepper
          currentStep={currentStep}
          onStepChange={goToStep}
          includeAssessment={includeAssessment}
        >
          {includeAssessment ? (
            <div hidden={currentStepKey !== "assessment"}>
              <StudentAssessmentStep
                ref={assessmentStepRef}
                formDefinitionId={assessmentFormId}
                preferenceEntity={preferenceEntity}
                isOpen={isOpen}
                locale={locale}
                onSaveAssessment={handleSaveAssessment}
                onValidityChange={setAssessmentValid}
                saveFeedback={assessmentSaveFeedback}
                onDismissSaveFeedback={clearAssessmentSaveFeedback}
              />
            </div>
          ) : null}

          {currentStepKey === "classmates" && (
            <>
              {matchingPreferenceCard}
              <h2>
                {t("opportunities.studentView.rankForm.classmatesHeading", {}, {
                  default: "Rank your classmates",
                })}
              </h2>
              {hasTeamOpps ? (
                <>
                  <p className="helper">
                    {t(
                      "opportunities.studentView.rankForm.classmatesHelper",
                      {
                        count: effectivePicks,
                        title: largestTeamOpp?.title || "",
                      },
                      {
                        default:
                          "You'll be on a team with {{count}} other classmates (based on the largest favorited team: {{title}}). Pick the {{count}} classmates you want with you. Drag to order them. Your top {{count}} are highlighted, and those are the ones that count. To be placed together, all of you have to pick each other. Add more names below as backups.",
                      },
                    )}
                  </p>
                  {favoritedTeamProjectsNote ? (
                    <p className="helper">{favoritedTeamProjectsNote}</p>
                  ) : null}
                  <ClassmateRankList
                    students={networkStudents}
                    classmateOrder={classmateOrder}
                    onClassmateOrderChange={setClassmateOrder}
                    effectivePicks={effectivePicks}
                    rankingEnabled={rankingEnabled}
                  />
                </>
              ) : (
                <p className="helper">
                  {t(
                    "opportunities.studentView.rankForm.classmatesNoneInRound",
                    {},
                    {
                      default:
                        "No team projects in this round — you can skip to opportunity ranking.",
                    },
                  )}
                </p>
              )}
            </>
          )}

          {currentStepKey === "opportunities" && (
            <>
              {matchingPreferenceCard}
              <h2>
                {isStaffEdit
                  ? t(
                      "opportunities.matchingRound.studentRanking.editBallotRankHeading",
                      {},
                      { default: "Rank opportunities" },
                    )
                  : t("opportunities.studentView.rankForm.rankHeading", {}, {
                      default: "Rank your favorites",
                    })}
              </h2>
              <p className="helper">
                {isStaffEdit
                  ? t(
                      "opportunities.matchingRound.studentRanking.editBallotRankHelper",
                      {},
                      {
                        default:
                          "Add opportunities by searching their title, then drag to set order (1 = top choice).",
                      },
                    )
                  : t("opportunities.studentView.rankForm.rankHelper", {}, {
                      default:
                        "Drag to set your order (1 = top choice). Add a private note for your teacher if you like.",
                    })}
              </p>
              {!isStaffEdit && opportunities.length === 0 && (
                <p className="helper">
                  {roundOpportunities.length > 0
                    ? `${t(
                        "opportunities.studentView.rankForm.emptyFavoritesTitle",
                        {},
                        { default: "No favorited opportunities yet" },
                      )} ${t(
                        "opportunities.studentView.rankForm.emptyFavoritesHint",
                        {},
                        {
                          default:
                            "Go back and tap the star on the opportunities you want to rank.",
                        },
                      )}`
                    : t(
                        "opportunities.studentView.rankForm.noOpportunities",
                        {},
                        {
                          default:
                            "No opportunities have been added to this round yet.",
                        },
                      )}
                </p>
              )}
              {isStaffEdit && opportunities.length === 0 ? (
                <p className="helper">
                  {t(
                    "opportunities.matchingRound.studentRanking.editBallotRankEmpty",
                    {},
                    {
                      default:
                        "No opportunities on this ballot yet. Search below to add one.",
                    },
                  )}
                </p>
              ) : null}
              {opportunities.length > 0 ? (
                <FavoriteRankList
                  opportunities={opportunities}
                  rankings={rankings}
                  onRankingsChange={updateRankings}
                  rankingEnabled={rankingEnabled}
                  syncKey={`${existingPreference?.id || "new"}:${rankingOppIdsKey}`}
                  now={now}
                  onRemoveOpportunity={
                    isStaffEdit ? handleStaffRemoveOpportunity : undefined
                  }
                />
              ) : null}
              {isStaffEdit && roundOpportunities.length > 0 ? (
                <StaffOppPool>
                  <StaffOppPoolToggle
                    type="button"
                    aria-expanded={staffOppPoolOpen}
                    onClick={() => setStaffOppPoolOpen((open) => !open)}
                  >
                    <StaffOppPoolToggleLeading>
                      <AddIcon width={18} height={18} aria-hidden />
                      <span>
                        {t(
                          "opportunities.matchingRound.studentRanking.editBallotAddOpportunity",
                          {},
                          { default: "Add an opportunity" },
                        )}
                      </span>
                    </StaffOppPoolToggleLeading>
                    <img
                      src="/assets/icons/builder/medium-chevron-down.svg"
                      alt=""
                      aria-hidden
                      width={16}
                      height={16}
                      style={{
                        transform: staffOppPoolOpen
                          ? "rotate(180deg)"
                          : "none",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  </StaffOppPoolToggle>
                  {staffOppPoolOpen ? (
                    <>
                      <StaffOppPoolHint>
                        {t(
                          "opportunities.matchingRound.studentRanking.editBallotAddOpportunityHelper",
                          {},
                          {
                            default:
                              "Search round opportunities by title. This does not change the student’s favorites.",
                          },
                        )}
                      </StaffOppPoolHint>
                      <StaffOppSearch
                        type="search"
                        value={staffOppSearch}
                        onChange={(e) => setStaffOppSearch(e.target.value)}
                        placeholder={t(
                          "opportunities.matchingRound.studentRanking.editBallotOppSearch",
                          {},
                          {
                            default:
                              "Add an opportunity — search by title",
                          },
                        )}
                        aria-label={t(
                          "opportunities.matchingRound.studentRanking.editBallotOppSearch",
                          {},
                          {
                            default:
                              "Add an opportunity — search by title",
                          },
                        )}
                      />
                      <StaffOppPoolList>
                        {staffPoolOpportunities.length === 0 ? (
                          <StaffOppPoolHint>
                            {staffOppSearch.trim()
                              ? t(
                                  "opportunities.matchingRound.studentRanking.editBallotOppSearchEmpty",
                                  {},
                                  {
                                    default:
                                      "No opportunities match your search.",
                                  },
                                )
                              : t(
                                  "opportunities.matchingRound.studentRanking.editBallotOppPoolEmpty",
                                  {},
                                  {
                                    default:
                                      "All round opportunities are already on this ballot.",
                                  },
                                )}
                          </StaffOppPoolHint>
                        ) : (
                          staffPoolOpportunities.map((opp) => (
                            <StaffOppPoolRow key={opp.id}>
                              <StaffOppPoolTitle title={opp.title}>
                                {opp.title || "—"}
                              </StaffOppPoolTitle>
                              <IconButton
                                type="button"
                                variant="tonal"
                                ariaLabel={t(
                                  "opportunities.matchingRound.studentRanking.editBallotAddOne",
                                  { title: opp.title || "" },
                                  { default: "Add {{title}}" },
                                )}
                                title={t(
                                  "opportunities.matchingRound.studentRanking.editBallotAddOne",
                                  { title: opp.title || "" },
                                  { default: "Add {{title}}" },
                                )}
                                onClick={() =>
                                  handleStaffAddOpportunity(opp.id)
                                }
                                disabled={!rankingEnabled}
                                icon={
                                  <AddIcon
                                    width={18}
                                    height={18}
                                    aria-hidden
                                  />
                                }
                              />
                            </StaffOppPoolRow>
                          ))
                        )}
                      </StaffOppPoolList>
                    </>
                  ) : null}
                </StaffOppPool>
              ) : null}
            </>
          )}

          {currentStepKey === "review" && (
            <>
              <h2>
                {t("opportunities.studentView.rankForm.reviewHeading", {}, {
                  default: "Review and submit",
                })}
              </h2>
              <PreferenceSubmissionReview
                students={networkStudents}
                classmateOrder={classmateOrder}
                effectivePicks={effectivePicks}
                teamEligibleOpportunities={teamEligibleOpps}
                opportunities={opportunities}
                rankings={rankings}
                notes={notes}
                onNotesChange={setNotes}
                isOpen={isOpen}
              />
            </>
          )}
        </PreferenceSubmissionStepper>
      </Card>
      </RankPageBody>
      <RankingDriftRepairModal
        open={showDriftRepairModal}
        driftCount={draftDriftEntries.length}
        onRestoreFavorites={handleRestoreDriftFavorites}
        onRemoveFromDraft={handleRemoveDriftFromDraft}
        loading={driftRepairLoading}
      />
    </RankPageShell>
  );
}
