import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  GET_CONNECT_ROUND,
  MY_CONNECT_ROUNDS,
  NETWORK_OPPORTUNITIES_FOR_ROUND,
} from "../../../Queries/ConnectRound";
import { QUESTION_LIBRARY } from "../../../Queries/ConnectQuestion";
import {
  CREATE_CONNECT_ROUND,
  UPDATE_CONNECT_ROUND,
} from "../../../Mutations/ConnectRound";
import {
  EMPTY_FORM,
  buildSuggestedRoundDefaults,
  toDateInputValue,
  toIsoOrNull,
} from "../../Connect/Rounds/roundFormConfig";
import MatchingRoundOpportunitiesGrid from "./MatchingRoundOpportunitiesGrid";

const ROUND_STATUS_KEYS = {
  draft: "draft",
  preferences_open: "preferencesOpen",
  preferences_closed: "preferencesClosed",
  matching: "matching",
  published: "published",
  archived: "archived",
};

function getRoundStatusParts(status, t) {
  const key = ROUND_STATUS_KEYS[status];
  if (!key) return { short: status, hint: "" };
  return {
    short: t(`opportunities.matchingRound.status.${key}`, {}, {
      default: status,
    }),
    hint: t(`opportunities.matchingRound.status.${key}Hint`, {}, {
      default: "",
    }),
  };
}

function RoundStatusLabel({ status, t, variant = "chip" }) {
  const { short, hint } = getRoundStatusParts(status, t);
  const isChip = variant === "chip";
  return (
    <span
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: isChip ? "1px" : "2px",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontWeight: 600,
          fontSize: isChip ? "12px" : "14px",
          lineHeight: isChip ? "16px" : "18px",
          color: "#5f6871",
        }}
      >
        {short}
      </span>
      {hint ? (
        <span
          style={{
            fontWeight: 500,
            fontSize: isChip ? "11px" : "12px",
            lineHeight: isChip ? "14px" : "16px",
            color: "#6a6a6a",
          }}
        >
          {hint}
        </span>
      ) : null}
    </span>
  );
}

const ALGO_I18N_KEYS = {
  stable_matching: "stableMatching",
  score_based: "scoreBased",
  teacher_curated: "teacherCurated",
};

const PANELS = {
  settings: "settings",
  review: "review",
  selected: "selected",
  questions: "questions",
};

function buildSnapshot(inputs, opportunityIds, questionIds) {
  return {
    title: inputs.title || "",
    description: inputs.description || "",
    status: inputs.status || "draft",
    openAt: inputs.openAt || "",
    closeAt: inputs.closeAt || "",
    matchingAlgorithm: inputs.matchingAlgorithm || "stable_matching",
    opportunities: [...opportunityIds].sort(),
    questions: [...questionIds].sort(),
  };
}

function snapshotsEqual(a, b) {
  if (!a || !b) return a === b;
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.openAt === b.openAt &&
    a.closeAt === b.closeAt &&
    a.matchingAlgorithm === b.matchingAlgorithm &&
    JSON.stringify(a.opportunities) === JSON.stringify(b.opportunities) &&
    JSON.stringify(a.questions) === JSON.stringify(b.questions)
  );
}

function sortOpportunitiesByTitle(opportunities) {
  return [...opportunities].sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    }),
  );
}

export default function ClassMatchingRoundSection({
  myclass,
  selectedNetworkId,
  selectedNetwork,
  onPreviewOpportunity,
  onRegisterNavigationGuard,
  onMatchingRoundContextChange,
}) {
  const { t } = useTranslation("classes");
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [explicitNewRound, setExplicitNewRound] = useState(false);
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState(PANELS.settings);
  const [snapshotRevision, setSnapshotRevision] = useState(0);
  const [togglingOpportunityId, setTogglingOpportunityId] = useState(null);
  const savedSnapshotRef = useRef(null);

  const classNetworkIds = useMemo(
    () => new Set((myclass?.networks || []).map((n) => n.id)),
    [myclass?.networks],
  );

  const { data: roundsData, loading: loadingRounds } = useQuery(
    MY_CONNECT_ROUNDS,
    { fetchPolicy: "cache-and-network" },
  );

  const allRounds = roundsData?.authenticatedItem?.connectRoundsCreated || [];

  const roundsForNetwork = useMemo(() => {
    if (!selectedNetworkId) return [];
    return allRounds
      .filter(
        (round) =>
          round.classNetwork?.id === selectedNetworkId &&
          classNetworkIds.has(round.classNetwork?.id),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
  }, [allRounds, selectedNetworkId, classNetworkIds]);

  const isNew = !activeRoundId;

  const { data: roundData } = useQuery(
    GET_CONNECT_ROUND,
    {
      variables: { id: activeRoundId },
      skip: !activeRoundId,
      fetchPolicy: "cache-and-network",
    },
  );

  const round = roundData?.connectRound;

  const { inputs, handleChange, handleMultipleUpdate } = useForm(EMPTY_FORM);

  const captureSnapshot = useCallback(
    (nextInputs, nextOpportunities, nextQuestions) => {
      savedSnapshotRef.current = buildSnapshot(
        nextInputs,
        nextOpportunities,
        nextQuestions,
      );
      setSnapshotRevision((revision) => revision + 1);
    },
    [],
  );

  const isDirty = useMemo(() => {
    if (!formInitialized || !savedSnapshotRef.current) return false;
    const current = buildSnapshot(
      inputs,
      selectedOpportunities,
      selectedQuestions,
    );
    return !snapshotsEqual(current, savedSnapshotRef.current);
  }, [
    formInitialized,
    inputs,
    selectedOpportunities,
    selectedQuestions,
    snapshotRevision,
  ]);

  const confirmIfDirty = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      t("opportunities.matchingRound.unsavedChangesConfirm", {}, {
        default: "You have unsaved changes. Leave without saving?",
      }),
    );
  }, [isDirty, t]);

  useEffect(() => {
    if (!onRegisterNavigationGuard) return;
    onRegisterNavigationGuard(confirmIfDirty);
    return () => onRegisterNavigationGuard(null);
  }, [confirmIfDirty, onRegisterNavigationGuard]);

  useEffect(() => {
    setExplicitNewRound(false);
    setExpanded(false);
    setActivePanel(PANELS.settings);
  }, [selectedNetworkId]);

  useEffect(() => {
    if (!selectedNetworkId) {
      setActiveRoundId(null);
      setExplicitNewRound(false);
      setFormInitialized(false);
      savedSnapshotRef.current = null;
      return;
    }

    if (roundsForNetwork.length === 0) {
      setActiveRoundId(null);
      setExplicitNewRound(false);
      setFormInitialized(false);
      savedSnapshotRef.current = null;
      return;
    }

    if (explicitNewRound) return;

    const stillValid = roundsForNetwork.some((r) => r.id === activeRoundId);
    if (!activeRoundId || !stillValid) {
      setActiveRoundId(roundsForNetwork[0].id);
      setFormInitialized(false);
      setActivePanel(PANELS.settings);
    }
  }, [
    selectedNetworkId,
    roundsForNetwork,
    activeRoundId,
    explicitNewRound,
  ]);

  useEffect(() => {
    if (!selectedNetworkId) return;

    if (isNew) {
      if (formInitialized) return;

      const defaults = buildSuggestedRoundDefaults(
        myclass?.title,
        selectedNetwork?.title,
      );
      handleMultipleUpdate(defaults);
      setSelectedOpportunities([]);
      setSelectedQuestions([]);
      setFormInitialized(true);
      captureSnapshot(defaults, [], []);
      return;
    }

    if (!round || round.id !== activeRoundId) return;
    if (formInitialized) return;

    const nextInputs = {
      title: round.title || "",
      description: round.description || "",
      status: round.status || "draft",
      openAt: toDateInputValue(round.openAt),
      closeAt: toDateInputValue(round.closeAt),
      matchingAlgorithm: round.matchingAlgorithm || "stable_matching",
    };
    const nextOpportunities = (round.opportunities || []).map((o) => o.id);
    const nextQuestions = (round.questions || []).map((q) => q.id);

    handleMultipleUpdate(nextInputs);
    setSelectedOpportunities(nextOpportunities);
    setSelectedQuestions(nextQuestions);
    setFormInitialized(true);
    captureSnapshot(nextInputs, nextOpportunities, nextQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isNew,
    round?.id,
    activeRoundId,
    selectedNetworkId,
    formInitialized,
    myclass?.title,
    selectedNetwork?.title,
  ]);

  const { data: libraryData } = useQuery(QUESTION_LIBRARY, {
    fetchPolicy: "cache-and-network",
  });
  const libraryQuestions = (libraryData?.connectQuestions || []).filter(
    (q) => q.status === "approved",
  );

  const { data: opportunitiesData } = useQuery(
    NETWORK_OPPORTUNITIES_FOR_ROUND,
    {
      variables: { classNetworkId: selectedNetworkId },
      skip: !selectedNetworkId,
      fetchPolicy: "cache-and-network",
    },
  );
  const networkOpportunities = opportunitiesData?.opportunities || [];

  const selectedNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) => selectedSet.has(opportunity.id)),
    );
  }, [networkOpportunities, selectedOpportunities]);

  const reviewNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) => !selectedSet.has(opportunity.id)),
    );
  }, [networkOpportunities, selectedOpportunities]);

  const statusOptions = useMemo(
    () =>
      Object.entries(ROUND_STATUS_KEYS).map(([value]) => ({
        value,
        label: <RoundStatusLabel status={value} t={t} variant="menu" />,
      })),
    [t],
  );

  const algorithmOptions = useMemo(
    () =>
      Object.entries(ALGO_I18N_KEYS).map(([value, key]) => ({
        value,
        label: t(`opportunities.matchingRound.algorithm.${key}`, {}, {
          default: value,
        }),
      })),
    [t],
  );

  const panelOptions = useMemo(
    () => [
      {
        id: PANELS.settings,
        label: t("opportunities.matchingRound.panels.settings", {}, {
          default: "Settings",
        }),
      },
      {
        id: PANELS.review,
        label:
          reviewNetworkOpportunities.length > 0
            ? t(
                "opportunities.matchingRound.panels.reviewOpportunitiesWithCount",
                { count: reviewNetworkOpportunities.length },
                { default: "Review opportunities ({{count}})" },
              )
            : t("opportunities.matchingRound.panels.reviewOpportunities", {}, {
                default: "Review opportunities",
              }),
      },
      {
        id: PANELS.selected,
        label:
          selectedOpportunities.length > 0
            ? t(
                "opportunities.matchingRound.panels.selectedOpportunitiesWithCount",
                { count: selectedOpportunities.length },
                { default: "Selected opportunities ({{count}})" },
              )
            : t("opportunities.matchingRound.panels.selectedOpportunities", {}, {
                default: "Selected opportunities",
              }),
      },
      {
        id: PANELS.questions,
        label: t("opportunities.matchingRound.panels.questions", {}, {
          default: "Round questions",
        }),
      },
    ],
    [reviewNetworkOpportunities.length, selectedOpportunities.length, t],
  );

  const [createConnectRound, { loading: creating }] = useMutation(
    CREATE_CONNECT_ROUND,
    { refetchQueries: [{ query: MY_CONNECT_ROUNDS }] },
  );
  const [updateConnectRound, { loading: updating }] = useMutation(
    UPDATE_CONNECT_ROUND,
    {
      refetchQueries: [
        { query: MY_CONNECT_ROUNDS },
        ...(activeRoundId
          ? [{ query: GET_CONNECT_ROUND, variables: { id: activeRoundId } }]
          : []),
      ],
      awaitRefetchQueries: true,
    },
  );
  const saving = creating || updating;

  const persistOpportunitySelection = useCallback(
    async (nextIds, togglingId = null) => {
      const sortedCurrent = [...selectedOpportunities].sort();
      const sortedNext = [...nextIds].sort();
      if (JSON.stringify(sortedCurrent) === JSON.stringify(sortedNext)) {
        return;
      }

      if (isNew || !activeRoundId) {
        setSelectedOpportunities(nextIds);
        return;
      }

      if (togglingOpportunityId) return;

      setTogglingOpportunityId(togglingId);
      try {
        await updateConnectRound({
          variables: {
            id: activeRoundId,
            input: {
              opportunities: { set: nextIds.map((id) => ({ id })) },
              updatedAt: new Date().toISOString(),
            },
          },
        });
        setSelectedOpportunities(nextIds);
        captureSnapshot(inputs, nextIds, selectedQuestions);
      } catch (error) {
        console.error("Failed to update matching round opportunities", error);
        alert(
          t("opportunities.preview.matchingRound.toggleFailed", {}, {
            default: "Could not update this matching round. Please try again.",
          }),
        );
        throw error;
      } finally {
        setTogglingOpportunityId(null);
      }
    },
    [
      selectedOpportunities,
      isNew,
      activeRoundId,
      togglingOpportunityId,
      updateConnectRound,
      inputs,
      selectedQuestions,
      captureSnapshot,
      t,
    ],
  );

  const handleReviewSelectionChange = useCallback(
    async (checkedReviewIds) => {
      const reviewIds = new Set(reviewNetworkOpportunities.map((o) => o.id));
      const unchanged = selectedOpportunities.filter((id) => !reviewIds.has(id));
      const nextIds = [...unchanged, ...checkedReviewIds];

      const prevSet = new Set(selectedOpportunities);
      const nextSet = new Set(nextIds);
      const togglingId =
        nextIds.find((id) => !prevSet.has(id)) ||
        selectedOpportunities.find((id) => !nextSet.has(id)) ||
        null;

      try {
        await persistOpportunitySelection(nextIds, togglingId);
      } catch {
        // Grid resyncs from selectedOpportunities via selectedIds.
      }
    },
    [reviewNetworkOpportunities, selectedOpportunities, persistOpportunitySelection],
  );

  const handleRemoveFromRound = useCallback(
    async (opportunityId) => {
      const nextIds = selectedOpportunities.filter((id) => id !== opportunityId);
      try {
        await persistOpportunitySelection(nextIds, opportunityId);
      } catch {
        // Selection state unchanged on failure.
      }
    },
    [selectedOpportunities, persistOpportunitySelection],
  );

  const toggleQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const roundStatusLabel = (status) => (
    <RoundStatusLabel status={status} t={t} variant="chip" />
  );

  const algoHint = (algo) => {
    const key = ALGO_I18N_KEYS[algo];
    if (!key) return "";
    return t(
      `opportunities.matchingRound.algorithm.${key}Hint`,
      {},
      { default: "" },
    );
  };

  const handleStatusChange = async (value) => {
    const previousStatus = inputs.status;

    if (
      previousStatus === "draft" &&
      value === "preferences_open" &&
      !window.confirm(
        t("opportunities.matchingRound.openConfirm", {}, {
          default:
            "Students in this network will see this round and can submit preferences. Continue?",
        })
      )
    ) {
      return;
    }

    if (
      value === "draft" &&
      previousStatus !== "draft" &&
      !window.confirm(
        t("opportunities.matchingRound.revertToDraftConfirm", {}, {
          default:
            "Reverting to draft hides this round from students. Continue?",
        })
      )
    ) {
      return;
    }

    const nextInputs = { ...inputs, status: value };
    handleMultipleUpdate({ status: value });

    if (isNew || !activeRoundId) return;

    try {
      await updateConnectRound({
        variables: {
          id: activeRoundId,
          input: {
            status: value || "draft",
            updatedAt: new Date().toISOString(),
            publishedAt:
              value === "published" && !round?.publishedAt
                ? new Date().toISOString()
                : undefined,
          },
        },
      });
      captureSnapshot(
        nextInputs,
        selectedOpportunities,
        selectedQuestions,
      );
    } catch {
      handleMultipleUpdate({ status: previousStatus });
    }
  };

  const handleSave = async () => {
    if (!inputs.title?.trim()) {
      alert(
        t("opportunities.matchingRound.titleRequired", {}, {
          default: "Title is required.",
        }),
      );
      return;
    }
    if (!selectedNetworkId) return;

    const opportunitiesConnect = selectedOpportunities.map((id) => ({ id }));
    const questionsConnect = selectedQuestions.map((id) => ({ id }));

    try {
      if (isNew) {
        const result = await createConnectRound({
          variables: {
            input: {
              title: inputs.title,
              description: inputs.description || "",
              classNetwork: { connect: { id: selectedNetworkId } },
              status: inputs.status || "draft",
              openAt: toIsoOrNull(inputs.openAt),
              closeAt: toIsoOrNull(inputs.closeAt),
              matchingAlgorithm: inputs.matchingAlgorithm || "stable_matching",
              opportunities: opportunitiesConnect.length
                ? { connect: opportunitiesConnect }
                : undefined,
              questions: questionsConnect.length
                ? { connect: questionsConnect }
                : undefined,
            },
          },
        });
        const newId = result?.data?.createConnectRound?.id;
        if (newId) {
          captureSnapshot(inputs, selectedOpportunities, selectedQuestions);
          setExplicitNewRound(false);
          setActiveRoundId(newId);
          setActivePanel(PANELS.settings);
        }
      } else {
        await updateConnectRound({
          variables: {
            id: activeRoundId,
            input: {
              title: inputs.title,
              description: inputs.description || "",
              classNetwork: { connect: { id: selectedNetworkId } },
              status: inputs.status || "draft",
              openAt: toIsoOrNull(inputs.openAt),
              closeAt: toIsoOrNull(inputs.closeAt),
              matchingAlgorithm: inputs.matchingAlgorithm || "stable_matching",
              opportunities: { set: opportunitiesConnect },
              questions: { set: questionsConnect },
              updatedAt: new Date().toISOString(),
              publishedAt:
                inputs.status === "published" && !round?.publishedAt
                  ? new Date().toISOString()
                  : undefined,
            },
          },
        });
        captureSnapshot(inputs, selectedOpportunities, selectedQuestions);
      }
    } catch (error) {
      console.error("Failed to save matching round", error);
      alert(
        t("opportunities.matchingRound.saveFailed", {}, {
          default: "Could not save the matching round. Please try again.",
        }),
      );
    }
  };

  const beginNewRound = () => {
    setExplicitNewRound(true);
    setActiveRoundId(null);
    setFormInitialized(false);
    setActivePanel(PANELS.settings);
  };

  const handleStartNewRound = () => {
    if (!confirmIfDirty()) return;
    beginNewRound();
  };

  const handleRoundSwitcherChange = (value) => {
    if (!confirmIfDirty()) return;
    if (value === "new") {
      beginNewRound();
      return;
    }
    setExplicitNewRound(false);
    setActiveRoundId(value);
    setFormInitialized(false);
    setActivePanel(PANELS.settings);
  };

  const handleOpenCreate = () => {
    if (roundsForNetwork.length === 0) {
      setExplicitNewRound(false);
      setActiveRoundId(null);
      setFormInitialized(false);
    } else if (!confirmIfDirty()) {
      return;
    } else {
      beginNewRound();
    }
    setExpanded(true);
    setActivePanel(PANELS.settings);
  };

  const loading = loadingRounds || !formInitialized;

  const activeRoundSummary = roundsForNetwork.find((r) => r.id === activeRoundId);
  const hasRoundForNetwork = roundsForNetwork.length > 0 && !isNew;
  const noRoundForNetwork =
    selectedNetworkId && !loadingRounds && roundsForNetwork.length === 0;

  const displayRoundTitle =
    activeRoundSummary?.title ||
    round?.title ||
    (formInitialized && hasRoundForNetwork && inputs.title?.trim()
      ? inputs.title
      : null);

  const canManageOpportunities = Boolean(
    selectedNetworkId &&
      formInitialized &&
      !loadingRounds &&
      !loading &&
      activeRoundId &&
      !isNew,
  );

  const toggleOpportunityInRound = useCallback(
    async (opportunityId) => {
      if (togglingOpportunityId) return;

      const isCurrentlySelected = selectedOpportunities.includes(opportunityId);
      const nextIds = isCurrentlySelected
        ? selectedOpportunities.filter((id) => id !== opportunityId)
        : [...selectedOpportunities, opportunityId];

      try {
        await persistOpportunitySelection(nextIds, opportunityId);
      } catch {
        // Modal and grids stay on previous selection.
      }
    },
    [selectedOpportunities, togglingOpportunityId, persistOpportunitySelection],
  );

  useEffect(() => {
    if (!onMatchingRoundContextChange) return;

    onMatchingRoundContextChange({
      roundTitle: displayRoundTitle,
      activeRoundId,
      selectedOpportunityIds: selectedOpportunities,
      canManageOpportunities,
      noRoundForNetwork: Boolean(noRoundForNetwork),
      togglingOpportunityId,
      toggleOpportunity: toggleOpportunityInRound,
    });

    return () => onMatchingRoundContextChange(null);
  }, [
    onMatchingRoundContextChange,
    displayRoundTitle,
    activeRoundId,
    selectedOpportunities,
    canManageOpportunities,
    noRoundForNetwork,
    togglingOpportunityId,
    toggleOpportunityInRound,
  ]);

  const cardHeaderTitle = selectedNetworkId
    ? noRoundForNetwork
      ? t("opportunities.matchingRound.noRoundForNetwork", {}, {
          default: "No matching round for this network yet.",
        })
      : displayRoundTitle ||
        t("opportunities.matchingRound.loading", {}, {
          default: "Loading matching round…",
        })
    : null;

  const displayStatus = hasRoundForNetwork
    ? formInitialized
      ? inputs.status
      : activeRoundSummary?.status || round?.status
    : null;
  const displayStatusLabel = displayStatus
    ? roundStatusLabel(displayStatus)
    : t("opportunities.matchingRound.notSetUp", {}, { default: "Not set up" });

  const canEditStatus = Boolean(
    selectedNetworkId && formInitialized && !loadingRounds && !loading,
  );

  const showCreateInHeader = Boolean(noRoundForNetwork && !expanded);
  const showStatusInHeader = Boolean(
    selectedNetworkId && canEditStatus && (hasRoundForNetwork || expanded),
  );

  const canToggleExpand = Boolean(
    selectedNetworkId && (hasRoundForNetwork || expanded),
  );

  const handleToggleExpand = () => {
    if (!canToggleExpand) return;
    if (expanded && !confirmIfDirty()) return;
    setExpanded((prev) => !prev);
  };

  const statusChipTriggerStyle = {
    borderRadius: "12px",
    border: "none",
    padding: "6px 12px",
    height: "auto",
    minHeight: "24px",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: "18px",
    alignItems: "flex-start",
    background: noRoundForNetwork ? "#f5f0e8" : "#f0f4f6",
    color: noRoundForNetwork ? "#8a6d3b" : "#5f6871",
  };

  const renderQuestionsPanel = () => (
    <div className="classTabMatchingRoundPanel">
      <p className="subsectionHint">
        {t("opportunities.matchingRound.fields.questionsHint", {}, {
          default:
            "Students answer these once when participating. Pick from approved library questions.",
        })}
      </p>
      {libraryQuestions.length === 0 ? (
        <p className="classTabEmptyInline">
          {t("opportunities.matchingRound.noLibraryQuestions", {}, {
            default:
              "No approved library questions yet. Add some in the Question library.",
          })}
        </p>
      ) : (
        <div className="classTabCheckboxList">
          {libraryQuestions.map((question) => {
            const checked = selectedQuestions.includes(question.id);
            return (
              <label
                key={question.id}
                className={`classTabCheckboxRow${checked ? " selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleQuestion(question.id)}
                />
                <div className="checkboxBody">
                  <div className="checkboxTitle">{question.prompt}</div>
                  <p className="checkboxMeta">
                    {question.questionType}
                    {question.isRequired ? " · required" : ""}
                    {typeof question.weight === "number"
                      ? ` · weight ${question.weight}`
                      : ""}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderReviewPanel = () => (
    <div className="classTabMatchingRoundPanel">
      <p className="subsectionHint">
        {t("opportunities.matchingRound.fields.opportunitiesHint", {}, {
          default:
            "Select which published opportunities students can rank in this round.",
        })}
      </p>
      {networkOpportunities.length === 0 ? (
        <p className="classTabEmptyInline">
          {t("opportunities.matchingRound.noOpportunitiesInNetwork", {}, {
            default:
              "No opportunities have been added to this class network yet.",
          })}
        </p>
      ) : (
        <MatchingRoundOpportunitiesGrid
          opportunities={reviewNetworkOpportunities}
          selectedIds={[]}
          onSelectionChange={handleReviewSelectionChange}
          onPreview={onPreviewOpportunity}
          selectionDisabled={Boolean(togglingOpportunityId)}
          togglingOpportunityId={togglingOpportunityId}
          emptyMessage={t("opportunities.matchingRound.reviewOpportunitiesEmpty", {}, {
            default:
              "All network opportunities are already in this round. Remove some from Selected opportunities to review more.",
          })}
        />
      )}
    </div>
  );

  const renderSelectedPanel = () => (
    <div className="classTabMatchingRoundPanel">
      <MatchingRoundOpportunitiesGrid
        opportunities={selectedNetworkOpportunities}
        selectedIds={selectedOpportunities}
        selectionMode="readOnly"
        onPreview={onPreviewOpportunity}
        onRemove={canManageOpportunities ? handleRemoveFromRound : undefined}
        togglingOpportunityId={togglingOpportunityId}
        emptyMessage={t("opportunities.matchingRound.selectedOpportunitiesEmpty", {}, {
          default:
            "No opportunities selected yet. Use Review opportunities to add some.",
        })}
      />
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="classTabMatchingRoundPanel">
      {roundsForNetwork.length > 1 && (
        <div className="classTabRoundSwitcher">
          <label className="classTabFormField">
            <span className="fieldLabel">
              {t("opportunities.matchingRound.roundSwitcherLabel", {}, {
                default: "Matching round",
              })}
            </span>
            <select
              value={activeRoundId || "new"}
              onChange={(e) => handleRoundSwitcherChange(e.target.value)}
            >
              {roundsForNetwork.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
              <option value="new">
                {t("opportunities.matchingRound.newRound", {}, {
                  default: "New round",
                })}
              </option>
            </select>
          </label>
        </div>
      )}

      <label className="classTabFormField">
        <span className="fieldLabel">
          {t("opportunities.matchingRound.fields.title", {}, {
            default: "Title",
          })}
        </span>
        <input
          type="text"
          name="title"
          value={inputs.title}
          onChange={handleChange}
        />
      </label>

      <label className="classTabFormField">
        <span className="fieldLabel">
          {t("opportunities.matchingRound.fields.description", {}, {
            default: "Description",
          })}
        </span>
        <textarea
          name="description"
          value={inputs.description}
          onChange={handleChange}
          rows={3}
        />
      </label>

      <div className="classTabFormGrid classTabFormGridTwo">
        <label className="classTabFormField">
          <span className="fieldLabel">
            {t("opportunities.matchingRound.fields.openAt", {}, {
              default: "Preferences open from",
            })}
          </span>
          <input
            type="date"
            name="openAt"
            value={inputs.openAt}
            onChange={handleChange}
          />
        </label>
        <label className="classTabFormField">
          <span className="fieldLabel">
            {t("opportunities.matchingRound.fields.closeAt", {}, {
              default: "Preferences close on",
            })}
          </span>
          <input
            type="date"
            name="closeAt"
            value={inputs.closeAt}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="classTabFormField">
        <span className="fieldLabel">
          {t("opportunities.matchingRound.fields.algorithm", {}, {
            default: "Matching algorithm",
          })}
        </span>
        <span className="fieldHint">
          {t("opportunities.matchingRound.algorithmHint", {}, {
            default:
              "The algorithm runs when you click Run matching on the matches dashboard — not when you save here.",
          })}
        </span>
        <div
          className="classTabMatchingRoundAlgoChipRow"
          role="radiogroup"
          aria-label={t("opportunities.matchingRound.fields.algorithm", {}, {
            default: "Matching algorithm",
          })}
        >
          {algorithmOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              shape="square"
              selected={inputs.matchingAlgorithm === option.value}
              onClick={() =>
                handleMultipleUpdate({ matchingAlgorithm: option.value })
              }
              ariaLabel={option.label}
            />
          ))}
        </div>
        {algoHint(inputs.matchingAlgorithm) ? (
          <p className="fieldAlgoHint">{algoHint(inputs.matchingAlgorithm)}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="classTabSection classTabExpandableCard">
      <div className="classTabExpandableHeaderBar">
        <button
          type="button"
          className={`classTabExpandableHeaderToggle${
            canToggleExpand ? "" : " isDisabled"
          }`}
          aria-expanded={expanded}
          aria-disabled={!canToggleExpand}
          disabled={!canToggleExpand}
          aria-label={
            !canToggleExpand
              ? cardHeaderTitle
              : expanded
                ? t("opportunities.matchingRound.collapseLabel", {}, {
                    default: "Collapse matching round settings",
                  })
                : t("opportunities.matchingRound.expandLabel", {}, {
                    default: "Expand matching round settings",
                  })
          }
          onClick={handleToggleExpand}
        >
          <div className="expandableHeaderMain">
            {selectedNetworkId ? (
              <h3
                className={
                  noRoundForNetwork ? "summaryRoundTitleMuted" : undefined
                }
              >
                {cardHeaderTitle}
              </h3>
            ) : (
              <p className="expandableSummaryHint">
                {t("opportunities.matchingRound.selectNetworkFirst", {}, {
                  default: "Select a class network above to set up a matching round.",
                })}
              </p>
            )}
          </div>
          {canToggleExpand ? (
            <img
              src="/assets/icons/expand.svg"
              alt=""
              aria-hidden
              className={`expandableChevron${expanded ? " expanded" : ""}`}
              width={16}
              height={16}
            />
          ) : null}
        </button>

        <div className="matchingRoundHeaderActions">
        {showCreateInHeader ? (
          <Button variant="filled" onClick={handleOpenCreate}>
            {t("opportunities.matchingRound.createRound", {}, {
              default: "Create round",
            })}
          </Button>
        ) : showStatusInHeader ? (
            <DropdownSelect
              fitContent
              value={inputs.status}
              options={statusOptions}
              onChange={handleStatusChange}
              disabled={updating}
              ariaLabel={t("opportunities.matchingRound.fields.status", {}, {
                default: "Status",
              })}
              triggerStyle={statusChipTriggerStyle}
            />
        ) : selectedNetworkId ? (
          <span
            className={`summaryStatus${
              noRoundForNetwork ? " summaryStatusMuted" : ""
            }`}
          >
            {displayStatusLabel}
          </span>
        ) : null}
        </div>
      </div>

      {expanded && selectedNetworkId && loading ? (
        <div className="classTabExpandableBody">
          <div className="classTabEmpty">
            <p>
              {t("opportunities.matchingRound.loading", {}, {
                default: "Loading matching round…",
              })}
            </p>
          </div>
        </div>
      ) : null}

      {expanded && selectedNetworkId && !loading ? (
        <div className="classTabExpandableBody">
          <p className="expandableBodyDescription">
            {t("opportunities.matchingRound.description", {}, {
              default:
                "Set up a matching round for your class. Students rank opportunities and the algorithm assigns matches when you run it.",
            })}
          </p>

          <div
            className="classTabMatchingRoundChipRow"
            role="tablist"
            aria-label={t("opportunities.matchingRound.title", {}, {
              default: "Matching round",
            })}
          >
            {panelOptions.map((panel) => (
              <Chip
                key={panel.id}
                label={panel.label}
                shape="square"
                selected={activePanel === panel.id}
                onClick={() => setActivePanel(panel.id)}
                ariaLabel={panel.label}
              />
            ))}
          </div>

          <div className="classTabMatchingRoundForm">
            {activePanel === PANELS.settings && renderSettingsPanel()}
            {activePanel === PANELS.review && renderReviewPanel()}
            {activePanel === PANELS.selected && renderSelectedPanel()}
            {activePanel === PANELS.questions && renderQuestionsPanel()}

            <div className="classTabMatchingRoundFooter">
              {isDirty ? (
                <p className="matchingRoundUnsavedHint">
                  {t("opportunities.matchingRound.unsavedChanges", {}, {
                    default: "Unsaved changes",
                  })}
                </p>
              ) : null}
              {!isNew && (
                <Link
                  href={{
                    pathname: "/dashboard/connect/matches",
                    query: { round: activeRoundId },
                  }}
                  className="classTabSecondaryLink"
                >
                  {t("opportunities.matchingRound.manageMatches", {}, {
                    default: "Manage matches",
                  })}
                </Link>
              )}
              {isDirty ? (
              <Button
                variant="filled"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? t("opportunities.matchingRound.saving", {}, {
                      default: "Saving…",
                    })
                  : isNew
                    ? t("opportunities.matchingRound.createRound", {}, {
                        default: "Create round",
                      })
                    : t("opportunities.matchingRound.saveRound", {}, {
                        default: "Save changes",
                      })}
              </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
