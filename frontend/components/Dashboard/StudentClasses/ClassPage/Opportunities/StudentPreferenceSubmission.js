import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import { GET_PARTICIPATE_VIEW } from "../../../../Queries/ConnectPreference";
import { formatOpportunitySponsorLabel } from "../../../../../lib/opportunityPeople";
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
import ClassmateRankList, {
  deriveClassmateOrder,
} from "./ClassmateRankList";
import FavoriteRankList from "./FavoriteRankList";
import PreferenceSubmissionReview from "./PreferenceSubmissionReview";
import PreferenceSubmissionStepper, {
  buildPreferenceStepKeys,
} from "./PreferenceSubmissionStepper";
import StudentAssessmentStep from "./StudentAssessmentStep";
import {
  isAssessmentFormAnswerComplete,
} from "../../../../../lib/connectPreferenceAssessmentData";

/** Round/opportunity questions are deferred; keep save paths dormant until re-enabled. */
const PREFERENCE_QUESTIONS_ENABLED = false;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #E6E6E6);

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
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #E6E6E6);
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
          background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
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

export default function StudentPreferenceSubmission({ roundId, user, onBack }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const locale = router?.locale || "en-us";
  const backLabel = t("opportunities.studentView.rankForm.backLink", {}, {
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
  const existingPreference = me?.connectPreferences?.[0];
  const existingTeamPrefs = me?.teamPreferencesSubmitted || [];
  const existingAnswers = me?.questionAnswers || [];

  const approvedRoundQuestions = (round?.questions || []).filter(
    (q) => q.status === "approved"
  );
  const favoriteIds = new Set(
    [
      ...(me?.favoriteOpportunities || []),
      ...(user?.favoriteOpportunities || []),
    ]
      .map((o) => o?.id)
      .filter(Boolean),
  );
  const rankedIds = new Set(
    (existingPreference?.items || [])
      .map((item) => item.opportunity?.id)
      .filter(Boolean),
  );
  const roundOpportunities = round?.opportunities || [];
  const opportunities = roundOpportunities.filter(
    (opp) => favoriteIds.has(opp.id) || rankedIds.has(opp.id),
  );

  const [roundAnswers, setRoundAnswers] = useState({});
  const [oppAnswers, setOppAnswers] = useState({});
  const [rankings, setRankings] = useState({});
  const [classmateOrder, setClassmateOrder] = useState([]);
  const [notes, setNotes] = useState("");
  const [assessmentData, setAssessmentData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const teamEligibleOpps = useMemo(
    () =>
      roundOpportunities.filter(
        (o) => o.teamSize > 1 && o.allowsTeamPreferences,
      ),
    [roundOpportunities],
  );
  const teamEligibleOppIds = useMemo(
    () => teamEligibleOpps.map((o) => o.id).filter(Boolean),
    [teamEligibleOpps],
  );
  const hasTeamOpps = teamEligibleOpps.length > 0;
  const maxClassmatePicks = hasTeamOpps
    ? Math.max(...teamEligibleOpps.map((o) => (o.teamSize || 1) - 1), 0)
    : 0;

  const networkStudents = (() => {
    const map = new Map();
    (round?.classNetwork?.classes || []).forEach((cls) => {
      (cls.students || []).forEach((s) => {
        if (s.id !== me?.id) map.set(s.id, s);
      });
    });
    return Array.from(map.values());
  })();

  useEffect(() => {
    const raw = router.query.step;
    const stepNum = Number(raw);
    if (raw && stepNum >= 1 && stepNum <= totalSteps) {
      setCurrentStep(stepNum);
    }
  }, [router.query.step, totalSteps]);

  const goToStep = useCallback(
    (step) => {
      const next = Math.min(totalSteps, Math.max(1, step));
      setCurrentStep(next);
      if (router.query.round) {
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
    [router, totalSteps],
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
    (existingPreference?.items || []).forEach((item) => {
      if (!item.opportunity?.id) return;
      r[item.opportunity.id] = {
        rank: item.rank ?? "",
        starRating: item.starRating ?? "",
        comment: item.comment || "",
      };
    });
    setRankings(r);

    setClassmateOrder(
      deriveClassmateOrder(existingTeamPrefs, teamEligibleOppIds),
    );

    setNotes(existingPreference?.notes || "");
    setAssessmentData(existingPreference?.assessmentData || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id, existingPreference?.id, teamEligibleOppIds.join(",")]);

  const [createPreference] = useMutation(CREATE_PREFERENCE);
  const [updatePreference] = useMutation(UPDATE_PREFERENCE);
  const [deletePreferenceItems] = useMutation(DELETE_PREFERENCE_ITEMS);
  const [deleteTeamPreferences] = useMutation(DELETE_TEAM_PREFERENCES);
  const [createTeamPreferences] = useMutation(CREATE_TEAM_PREFERENCES);
  const [deleteQuestionAnswers] = useMutation(DELETE_QUESTION_ANSWERS);
  const [createQuestionAnswers] = useMutation(CREATE_QUESTION_ANSWERS);
  const [createRating] = useMutation(CREATE_RATING);
  const [updateRating] = useMutation(UPDATE_RATING);

  const [saving, setSaving] = useState(false);
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [savingRatingId, setSavingRatingId] = useState(null);
  const [formSaveFeedback, setFormSaveFeedback] = useState(null);
  const [assessmentSaveFeedback, setAssessmentSaveFeedback] = useState(null);

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

      const hasItems = Object.entries(rankings).some(([, r]) => {
        if (!r) return false;
        return (
          (r.rank !== "" && r.rank !== undefined && r.rank !== null) ||
          (r.starRating !== "" &&
            r.starRating !== undefined &&
            r.starRating !== null) ||
          (r.comment || "").trim()
        );
      });
      if (!hasItems) {
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
      const items = Object.entries(rankings)
        .filter(
          ([, r]) =>
            r &&
            (r.rank !== "" || r.starRating !== "" || (r.comment || "").trim())
        )
        .map(([oppId, r]) => ({
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

      if (existingPreference?.id) {
        await updatePreference({
          variables: {
            id: existingPreference.id,
            input: {
              status: targetStatus,
              notes,
              submittedAt,
              assessmentData: nextAssessmentData,
              items: items.length ? { create: items } : undefined,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        await createPreference({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              role: "student",
              status: targetStatus,
              notes,
              submittedAt,
              assessmentData: nextAssessmentData,
              items: items.length ? { create: items } : undefined,
            },
          },
        });
      }

      if (assessmentDataOverride) {
        setAssessmentData(nextAssessmentData);
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
          });
        });
      });
      if (newTeamPrefs.length) {
        await createTeamPreferences({ variables: { data: newTeamPrefs } });
      }

      await refetch();

      if (targetStatus === "submitted") {
        setScopedSaveFeedback("form", {
          variant: "success",
          message: t(
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
          message: t(
            "opportunities.studentView.rankForm.draftSaveSuccess",
            {},
            { default: "Your progress was saved." },
          ),
        });
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
  const openAtMs = round.openAt ? new Date(round.openAt).getTime() : null;
  const closeAtMs = round.closeAt ? new Date(round.closeAt).getTime() : null;
  const beforeOpen = openAtMs && now < openAtMs;
  const afterClose = closeAtMs && now > closeAtMs;
  const inTimeWindow = !beforeOpen && !afterClose;
  const submitted = existingPreference?.status === "submitted";
  // Once submitted, lock the form. Students still see what they sent.
  // (If the round re-opens after a teacher pushed status back, the form
  // unlocks automatically because `submitted` is recomputed from data.)
  const isOpen =
    round.status === "preferences_open" && inTimeWindow && !submitted;

  let lockReason = null;
  if (round.status === "draft") {
    lockReason = t("opportunities.studentView.rankForm.notAvailableYet", {}, {
      default:
        "This round is not available yet. Your teacher is still setting it up.",
    });
  } else if (round.status !== "preferences_open") {
    lockReason = `Preferences are ${round.status.replace("_", " ")} for this round. You can review what you submitted, but changes are no longer accepted.`;
  } else if (beforeOpen) {
    const openDate = new Date(round.openAt).toLocaleDateString();
    lockReason = `This round opens on ${openDate}. Come back then to submit your preferences.`;
  } else if (afterClose) {
    const closeDate = new Date(round.closeAt).toLocaleDateString();
    lockReason = `Preferences closed on ${closeDate}. You can review what you submitted, but changes are no longer accepted.`;
  } else if (submitted) {
    const when = existingPreference?.submittedAt
      ? new Date(existingPreference.submittedAt).toLocaleString()
      : "earlier";
    lockReason = `You submitted your preferences ${when}. Need to change something? Ask your teacher — they can reopen your submission.`;
  }

  const pageTitle = round.title || "";
  const statusChipLabel = existingPreference
    ? submitted
      ? t("opportunities.studentView.rankForm.statusSubmitted", {}, {
          default: "Submitted",
        })
      : t("opportunities.studentView.rankForm.statusDraft", {}, {
          default: "Draft saved",
        })
    : null;
  const handleSaveDraft = () => handleSave("draft");
  const handleSubmitPreferences = () => handleSave("submitted");

  const preferenceEntity = {
    id: existingPreference?.id,
    assessmentData,
  };

  const handleSaveAssessment = async (nextAssessmentData) => {
    return handleSave("draft", {
      assessmentDataOverride: nextAssessmentData,
      feedbackScope: "assessment",
    });
  };

  const handleAssessmentValidationFailed = () => {
    setAssessmentSaveFeedback({
      variant: "warning",
      message: t(
        "opportunities.studentView.rankForm.assessmentValidationFailed",
        {},
        {
          default:
            "Fix the highlighted fields before saving your assessment.",
        },
      ),
    });
  };

  const currentStepKey = stepKeys[currentStep - 1] || stepKeys[0];

  const savingLabel = t("opportunities.studentView.rankForm.saving", {}, {
    default: "Saving…",
  });
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
        disabled={saving}
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
        submitted={submitted}
        submitActions={headerSubmitActions}
      />
      <RankPageBody>
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

      {(me?.connectMatches || [])
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
        })}

      <Card>
        <PreferenceSubmissionStepper
          currentStep={currentStep}
          onStepChange={goToStep}
          includeAssessment={includeAssessment}
        >
          {currentStepKey === "assessment" && (
            <StudentAssessmentStep
              formDefinitionId={assessmentFormId}
              preferenceEntity={preferenceEntity}
              isOpen={isOpen}
              locale={locale}
              onSaveAssessment={handleSaveAssessment}
              onValidationFailed={handleAssessmentValidationFailed}
              saving={saving}
              saveFeedback={assessmentSaveFeedback}
              onDismissSaveFeedback={clearAssessmentSaveFeedback}
            />
          )}

          {currentStepKey === "classmates" && (
            <>
              <h2>
                {t("opportunities.studentView.rankForm.classmatesHeading", {}, {
                  default: "Rank your classmates",
                })}
              </h2>
              {hasTeamOpps ? (
                <>
                  <p className="helper">
                    {t("opportunities.studentView.rankForm.classmatesHelper", {}, {
                      default:
                        "Pick classmates you'd like on your team. Order matters — 1 is your top choice.",
                    })}
                  </p>
                  <ClassmateRankList
                    students={networkStudents}
                    classmateOrder={classmateOrder}
                    onClassmateOrderChange={setClassmateOrder}
                    maxPicks={maxClassmatePicks}
                    rankingEnabled={isOpen}
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
              <h2>
                {t("opportunities.studentView.rankForm.rankHeading", {}, {
                  default: "Rank your favorites",
                })}
              </h2>
              <p className="helper">
                {t("opportunities.studentView.rankForm.rankHelper", {}, {
                  default:
                    "Drag to set your order (1 = top choice). Rate each opportunity and add a private note for your teacher.",
                })}
              </p>
              {opportunities.length === 0 && (
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
              {opportunities.length > 0 ? (
                <FavoriteRankList
                  opportunities={opportunities}
                  rankings={rankings}
                  onRankingsChange={updateRankings}
                  rankingEnabled={isOpen}
                  syncKey={`${existingPreference?.id || "new"}:${opportunities.map((o) => o.id).join(",")}`}
                  now={now}
                />
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
    </RankPageShell>
  );
}
