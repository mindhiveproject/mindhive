import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../../lib/useForm";
import { classNetworkUrlRef } from "../../../../../lib/classNetworkRef";
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import CopyButton from "../../../../DesignSystem/CopyButton";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import Navbar, { NavbarItem } from "../../../../DesignSystem/Navbar";
import {
  GET_CONNECT_ROUND,
  MY_CONNECT_ROUNDS,
  NETWORK_OPPORTUNITIES_FOR_ROUND,
} from "../../../../Queries/ConnectRound";
import { QUESTION_LIBRARY } from "../../../../Queries/ConnectQuestion";
import {
  CREATE_CONNECT_ROUND,
  UPDATE_CONNECT_ROUND,
} from "../../../../Mutations/ConnectRound";
import { UPDATE_OPPORTUNITY } from "../../../../Mutations/Opportunity";
import {
  EMPTY_FORM,
  buildSuggestedRoundDefaults,
  toDateInputValue,
  toIsoOrNull,
} from "../../../Connect/Rounds/roundFormConfig";
import MatchingRoundOpportunitiesGrid from "./MatchingRoundOpportunitiesGrid";

const NETWORK_ICON = (
  <img
    src="/assets/connect/network.svg"
    alt=""
    aria-hidden
    width={18}
    height={18}
  />
);

function sortRoundsByRecency(rounds) {
  return [...rounds].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime(),
  );
}

const ROUND_STATUS_KEYS = {
  draft: "draft",
  preferences_open: "preferencesOpen",
  preferences_closed: "preferencesClosed",
  matching: "matching",
  published: "published",
  archived: "archived",
};

/** Statuses that should not be overwritten when adding to a matching round. */
const OPPORTUNITY_STATUS_AT_OR_BEYOND_PRESELECTED = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

/**
 * Only roll back to pending_review when removing from a round if status is
 * still at the matching-round pre-select step. Do not downgrade accepted /
 * published / closed / archived / returned.
 */
const OPPORTUNITY_STATUS_REVERTABLE_ON_ROUND_REMOVE = new Set(["pre_selected"]);

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
  onPreviewOpportunity,
  onMatchingRoundContextChange,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { origin } = absoluteUrl();
  const networks = myclass?.networks || [];

  const queryMatchingPanel = useMemo(() => {
    const raw = router.query?.matchingPanel;
    return typeof raw === "string" && Object.values(PANELS).includes(raw)
      ? raw
      : null;
  }, [router.query?.matchingPanel]);

  const queryNetworkId = useMemo(() => {
    const raw = router.query?.networkId;
    return typeof raw === "string" ? raw : null;
  }, [router.query?.networkId]);

  const [selectedNetworkId, setSelectedNetworkId] = useState(null);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [explicitNewRound, setExplicitNewRound] = useState(false);
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [activePanel, setActivePanel] = useState(PANELS.settings);
  const [snapshotRevision, setSnapshotRevision] = useState(0);
  const [togglingOpportunityId, setTogglingOpportunityId] = useState(null);
  const [hasAppliedInitialSelection, setHasAppliedInitialSelection] =
    useState(false);
  const savedSnapshotRef = useRef(null);

  const classNetworkIds = useMemo(
    () => new Set(networks.map((n) => n.id)),
    [networks],
  );

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId) || null,
    [networks, selectedNetworkId],
  );

  const { data: roundsData, loading: loadingRounds } = useQuery(
    MY_CONNECT_ROUNDS,
    { fetchPolicy: "cache-and-network" },
  );

  const allRounds = useMemo(() => {
    const profile = roundsData?.authenticatedItem;
    const seen = new Map();
    (profile?.connectRoundsCreated || []).forEach((round) => {
      if (round?.id) seen.set(round.id, round);
    });
    (profile?.connectRoundsReviewing || []).forEach((round) => {
      if (round?.id && !seen.has(round.id)) seen.set(round.id, round);
    });
    return Array.from(seen.values());
  }, [roundsData?.authenticatedItem]);

  const roundsForClass = useMemo(
    () =>
      sortRoundsByRecency(
        allRounds.filter(
          (round) =>
            round.classNetwork?.id &&
            classNetworkIds.has(round.classNetwork.id),
        ),
      ),
    [allRounds, classNetworkIds],
  );

  const roundsForNetwork = useMemo(() => {
    if (!selectedNetworkId) return [];
    return sortRoundsByRecency(
      roundsForClass.filter(
        (round) => round.classNetwork?.id === selectedNetworkId,
      ),
    );
  }, [roundsForClass, selectedNetworkId]);

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

  // Prefer ?matchingPanel=; otherwise stay expanded by default.
  useEffect(() => {
    if (queryMatchingPanel) {
      setExpanded(true);
      setActivePanel(queryMatchingPanel);
    }
  }, [queryMatchingPanel]);

  // Initial round / network selection across all class networks.
  useEffect(() => {
    if (loadingRounds || hasAppliedInitialSelection) return;
    if (networks.length === 0) {
      setHasAppliedInitialSelection(true);
      return;
    }

    const preferredNetwork = queryNetworkId
      ? networks.find(
          (network) =>
            network.id === queryNetworkId ||
            network.publicId === queryNetworkId,
        )
      : null;

    if (roundsForClass.length > 0) {
      const preferredRound = preferredNetwork
        ? roundsForClass.find(
            (round) => round.classNetwork?.id === preferredNetwork.id,
          )
        : null;
      const initialRound = preferredRound || roundsForClass[0];
      setActiveRoundId(initialRound.id);
      setSelectedNetworkId(initialRound.classNetwork?.id || networks[0].id);
      setExplicitNewRound(false);
    } else {
      setActiveRoundId(null);
      setSelectedNetworkId(preferredNetwork?.id || networks[0].id);
      setExplicitNewRound(false);
    }

    setFormInitialized(false);
    setExpanded(true);
    if (!queryMatchingPanel) {
      setActivePanel(PANELS.settings);
    }
    setHasAppliedInitialSelection(true);
  }, [
    loadingRounds,
    hasAppliedInitialSelection,
    networks,
    roundsForClass,
    queryNetworkId,
    queryMatchingPanel,
  ]);

  // Keep active round valid for the selected network (unless creating).
  useEffect(() => {
    if (!hasAppliedInitialSelection) return;
    if (!selectedNetworkId) {
      setActiveRoundId(null);
      setExplicitNewRound(false);
      setFormInitialized(false);
      savedSnapshotRef.current = null;
      return;
    }

    if (explicitNewRound) return;

    if (roundsForNetwork.length === 0) {
      if (activeRoundId) {
        setActiveRoundId(null);
        setFormInitialized(false);
        savedSnapshotRef.current = null;
      }
      return;
    }

    const stillValid = roundsForNetwork.some((r) => r.id === activeRoundId);
    if (!activeRoundId || !stillValid) {
      setActiveRoundId(roundsForNetwork[0].id);
      setFormInitialized(false);
      if (!queryMatchingPanel) {
        setActivePanel(PANELS.settings);
      }
    }
  }, [
    hasAppliedInitialSelection,
    selectedNetworkId,
    roundsForNetwork,
    activeRoundId,
    explicitNewRound,
    queryMatchingPanel,
  ]);

  // When networks list changes (e.g. class unlinked), drop invalid selection.
  useEffect(() => {
    if (!hasAppliedInitialSelection) return;
    if (networks.length === 0) {
      setSelectedNetworkId(null);
      setActiveRoundId(null);
      return;
    }
    if (
      selectedNetworkId &&
      !networks.some((network) => network.id === selectedNetworkId)
    ) {
      const fallbackRound = roundsForClass[0];
      if (fallbackRound) {
        setActiveRoundId(fallbackRound.id);
        setSelectedNetworkId(fallbackRound.classNetwork?.id || networks[0].id);
        setExplicitNewRound(false);
      } else {
        setSelectedNetworkId(networks[0].id);
        setActiveRoundId(null);
        setExplicitNewRound(false);
      }
      setFormInitialized(false);
    }
  }, [
    hasAppliedInitialSelection,
    networks,
    selectedNetworkId,
    roundsForClass,
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

    // Sync network from the loaded round (immutable association).
    if (round.classNetwork?.id && round.classNetwork.id !== selectedNetworkId) {
      setSelectedNetworkId(round.classNetwork.id);
    }

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

  const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
    refetchQueries: selectedNetworkId
      ? [
          {
            query: NETWORK_OPPORTUNITIES_FOR_ROUND,
            variables: { classNetworkId: selectedNetworkId },
          },
        ]
      : [],
  });

  const markOpportunitiesPreSelected = useCallback(
    async (opportunityIds) => {
      if (!opportunityIds?.length) return;

      const byId = new Map(
        networkOpportunities.map((opportunity) => [opportunity.id, opportunity]),
      );
      const idsToUpdate = opportunityIds.filter((id) => {
        const opportunity = byId.get(id);
        return (
          opportunity &&
          !OPPORTUNITY_STATUS_AT_OR_BEYOND_PRESELECTED.has(opportunity.status)
        );
      });

      if (!idsToUpdate.length) return;

      await Promise.all(
        idsToUpdate.map((id) =>
          updateOpportunity({
            variables: {
              id,
              input: { status: "pre_selected" },
            },
          }),
        ),
      );
    },
    [networkOpportunities, updateOpportunity],
  );

  const markOpportunitiesPendingReview = useCallback(
    async (opportunityIds) => {
      if (!opportunityIds?.length) return;

      const byId = new Map(
        networkOpportunities.map((opportunity) => [opportunity.id, opportunity]),
      );
      const idsToUpdate = opportunityIds.filter((id) => {
        const opportunity = byId.get(id);
        return (
          opportunity &&
          OPPORTUNITY_STATUS_REVERTABLE_ON_ROUND_REMOVE.has(opportunity.status)
        );
      });

      if (!idsToUpdate.length) return;

      await Promise.all(
        idsToUpdate.map((id) =>
          updateOpportunity({
            variables: {
              id,
              input: { status: "pending_review" },
            },
          }),
        ),
      );
    },
    [networkOpportunities, updateOpportunity],
  );

  const selectedNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) => selectedSet.has(opportunity.id)),
    );
  }, [networkOpportunities, selectedOpportunities]);

  const reviewNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) => {
        if (selectedSet.has(opportunity.id)) return false;
        // Available queue: pending_review, returned (greyed / last in grid),
        // and orphaned pre_selected (status set without round link, or round
        // link cleared before status was rolled back).
        return (
          opportunity.status === "pending_review" ||
          opportunity.status === "returned" ||
          opportunity.status === "pre_selected"
        );
      }),
    );
  }, [networkOpportunities, selectedOpportunities]);

  const reviewOpportunitiesCount = reviewNetworkOpportunities.length;

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
          reviewOpportunitiesCount > 0
            ? t(
                "opportunities.matchingRound.panels.reviewOpportunitiesWithCount",
                { count: reviewOpportunitiesCount },
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
                "opportunities.matchingRound.panels.preSelectedWithCount",
                { count: selectedOpportunities.length },
                { default: "Pre-selected ({{count}})" },
              )
            : t("opportunities.matchingRound.panels.preSelected", {}, {
                default: "Pre-selected",
              }),
      },
      {
        id: PANELS.questions,
        label: t("opportunities.matchingRound.panels.questions", {}, {
          default: "Student questions",
        }),
      },
    ],
    [reviewOpportunitiesCount, selectedOpportunities.length, t],
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

      const previousSet = new Set(selectedOpportunities);
      const nextSet = new Set(nextIds);
      const newlySelectedIds = nextIds.filter((id) => !previousSet.has(id));
      const newlyRemovedIds = selectedOpportunities.filter(
        (id) => !nextSet.has(id),
      );

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
        await markOpportunitiesPreSelected(newlySelectedIds);
        await markOpportunitiesPendingReview(newlyRemovedIds);
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
      markOpportunitiesPreSelected,
      markOpportunitiesPendingReview,
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
    if (!selectedNetworkId) {
      alert(
        t("opportunities.matchingRound.networkRequired", {}, {
          default: "Select a class network for this matching round.",
        }),
      );
      return;
    }

    const opportunitiesConnect = selectedOpportunities.map((id) => ({ id }));
    const questionsConnect = selectedQuestions.map((id) => ({ id }));
    const previouslySavedOpportunityIds = new Set(
      savedSnapshotRef.current?.opportunities || [],
    );
    const selectedSet = new Set(selectedOpportunities);
    const newlySelectedOpportunityIds = isNew
      ? selectedOpportunities
      : selectedOpportunities.filter(
          (id) => !previouslySavedOpportunityIds.has(id),
        );
    const newlyRemovedOpportunityIds = isNew
      ? []
      : [...previouslySavedOpportunityIds].filter((id) => !selectedSet.has(id));

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
          await markOpportunitiesPreSelected(newlySelectedOpportunityIds);
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
        await markOpportunitiesPreSelected(newlySelectedOpportunityIds);
        await markOpportunitiesPendingReview(newlyRemovedOpportunityIds);
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

  const beginNewRound = (networkId = selectedNetworkId) => {
    if (networkId && networkId !== selectedNetworkId) {
      setSelectedNetworkId(networkId);
    }
    setExplicitNewRound(true);
    setActiveRoundId(null);
    setFormInitialized(false);
    setActivePanel(PANELS.settings);
    setExpanded(true);
  };

  const handleCreateForAnotherNetwork = () => {
    if (!confirmIfDirty()) return;
    const otherNetwork =
      networks.find((network) => network.id !== selectedNetworkId) ||
      networks[0] ||
      null;
    beginNewRound(otherNetwork?.id || selectedNetworkId);
  };

  const handleCreateNetworkSelect = (networkId) => {
    if (!isNew || networkId === selectedNetworkId) return;
    setSelectedNetworkId(networkId);
    setFormInitialized(false);
    setSelectedOpportunities([]);
    setSelectedQuestions([]);
  };

  const handleRoundSwitcherChange = (value) => {
    if (!confirmIfDirty()) return;
    if (value === "new") {
      beginNewRound(selectedNetworkId);
      return;
    }
    const nextRound = roundsForNetwork.find((r) => r.id === value);
    setExplicitNewRound(false);
    setActiveRoundId(value);
    if (nextRound?.classNetwork?.id) {
      setSelectedNetworkId(nextRound.classNetwork.id);
    }
    setFormInitialized(false);
    setActivePanel(PANELS.settings);
  };

  const handleOpenCreate = () => {
    if (roundsForNetwork.length === 0 && roundsForClass.length === 0) {
      setExplicitNewRound(false);
      setActiveRoundId(null);
      setFormInitialized(false);
      if (!selectedNetworkId && networks[0]) {
        setSelectedNetworkId(networks[0].id);
      }
    } else if (!confirmIfDirty()) {
      return;
    } else {
      beginNewRound(selectedNetworkId || networks[0]?.id);
    }
    setExpanded(true);
    setActivePanel(PANELS.settings);
  };

  const loading =
    loadingRounds || !hasAppliedInitialSelection || !formInitialized;

  const activeRoundSummary =
    roundsForClass.find((r) => r.id === activeRoundId) ||
    roundsForNetwork.find((r) => r.id === activeRoundId);
  const hasRoundForNetwork = roundsForNetwork.length > 0 && !isNew;
  const noRoundForNetwork =
    selectedNetworkId &&
    !loadingRounds &&
    hasAppliedInitialSelection &&
    roundsForNetwork.length === 0 &&
    !explicitNewRound;
  const isCreatingRound =
    isNew && (explicitNewRound || roundsForNetwork.length === 0);

  const selectedNetworkShareRef = classNetworkUrlRef(selectedNetwork);
  const sponsorSignupAndInviteLink = selectedNetworkShareRef
    ? `${origin}/signup/sponsor?classNetwork=${selectedNetworkShareRef}`
    : "";
  const sponsorNetworkInviteLink = selectedNetworkShareRef
    ? `${origin}/login?classNetwork=${selectedNetworkShareRef}`
    : "";

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
      selectedNetworkId,
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
    selectedNetworkId,
    selectedOpportunities,
    canManageOpportunities,
    noRoundForNetwork,
    togglingOpportunityId,
    toggleOpportunityInRound,
  ]);

  const cardHeaderTitle = isCreatingRound
    ? t("opportunities.matchingRound.newRoundTitle", {}, {
        default: "New matching round",
      })
    : noRoundForNetwork
      ? t("opportunities.matchingRound.noRoundForNetwork", {}, {
          default: "No matching round for this network yet.",
        })
      : displayRoundTitle ||
        t("opportunities.matchingRound.loading", {}, {
          default: "Loading matching round…",
        });

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

  const showCreateInHeader = Boolean(
    (noRoundForNetwork || (roundsForClass.length === 0 && !isCreatingRound)) &&
      !expanded,
  );
  const showStatusInHeader = Boolean(
    selectedNetworkId && canEditStatus && (hasRoundForNetwork || expanded),
  );

  const canToggleExpand = Boolean(
    hasRoundForNetwork || isCreatingRound || expanded || roundsForClass.length > 0,
  );

  const showCreateForAnotherNetworkCta = Boolean(
    hasRoundForNetwork && networks.length > 0,
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
        {/* {t("opportunities.matchingRound.fields.opportunitiesHint", {}, {
          default:
            "Select which published opportunities students can rank in this round.",
        })} */}
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
          roundId={activeRoundId}
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
        roundId={activeRoundId}
        emptyMessage={t("opportunities.matchingRound.selectedOpportunitiesEmpty", {}, {
          default:
            "No opportunities selected yet. Use Review opportunities to add some.",
        })}
      />
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="classTabMatchingRoundPanel">
      {roundsForNetwork.length >= 1 && (
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

  const renderNetworkRow = () => (
    <div className="classTabMatchingRoundNetworkRow">
      <div className="matchingRoundNetworkConfirm">
        {isCreatingRound ? (
          <>
            <span className="matchingRoundNetworkLabel">
              {t("opportunities.matchingRound.pickNetworkLabel", {}, {
                default: "Choose a class network for this round",
              })}
            </span>
            <div
              className="classTabNetworkChipRow"
              role="radiogroup"
              aria-label={t("opportunities.matchingRound.pickNetworkLabel", {}, {
                default: "Choose a class network for this round",
              })}
            >
              {networks.map((network) => (
                <Chip
                  key={network.id}
                  className="classNetworkChip"
                  label={network.title}
                  shape="square"
                  selected={network.id === selectedNetworkId}
                  onClick={() => handleCreateNetworkSelect(network.id)}
                  leading={NETWORK_ICON}
                  ariaLabel={network.title}
                />
              ))}
            </div>
            <p className="matchingRoundNetworkHint">
              {t("opportunities.matchingRound.pickNetworkHint", {}, {
                default:
                  "This association is set when you create the round and cannot be changed later.",
              })}
            </p>
          </>
        ) : selectedNetwork ? (
          <div className="matchingRoundNetworkIdentity">
            <span className="matchingRoundNetworkIcon" aria-hidden>
              {NETWORK_ICON}
            </span>
            <div className="matchingRoundNetworkIdentityText">
              <span className="matchingRoundNetworkLabel">
                {t("opportunities.matchingRound.associatedNetwork", {}, {
                  default: "Class network",
                })}
              </span>
              <span className="matchingRoundNetworkTitle">
                {selectedNetwork.title}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="matchingRoundNetworkActions">
        {selectedNetworkShareRef ? (
          <div className="matchingRoundNetworkInviteActions">
            <CopyButton
              value={sponsorSignupAndInviteLink}
              style={{ fontWeight: 500 }}
              ariaLabel={t("opportunities.compactInvite.signupAndInviteLink", {}, {
                default: "Signup + invite to network",
              })}
            >
              {t("opportunities.compactInvite.signupAndInviteLink", {}, {
                default: "Signup + invite to network",
              })}
            </CopyButton>
            <CopyButton
              value={sponsorNetworkInviteLink}
              style={{ fontWeight: 500 }}
              ariaLabel={t("opportunities.compactInvite.inviteToNetworkLink", {}, {
                default: "Invite to network only",
              })}
            >
              {t("opportunities.compactInvite.inviteToNetworkLink", {}, {
                default: "Invite to network only",
              })}
            </CopyButton>
          </div>
        ) : null}
        {showCreateForAnotherNetworkCta ? (
          <>
            {selectedNetworkShareRef ? (
              <span className="matchingRoundNetworkActionsDivider" aria-hidden />
            ) : null}
            <Button
              variant="text"
              type="button"
              onClick={handleCreateForAnotherNetwork}
              style={{ fontWeight: 500, fontSize: 14, color: "#171717" }}
            >
              {t("opportunities.matchingRound.createForAnotherNetwork", {}, {
                default: "Create round for another network",
              })}
            </Button>
          </>
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
            <h3
              className={
                noRoundForNetwork || isCreatingRound
                  ? "summaryRoundTitleMuted"
                  : undefined
              }
            >
              {cardHeaderTitle}
            </h3>
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
        ) : (
          <span
            className={`summaryStatus${
              noRoundForNetwork || isCreatingRound ? " summaryStatusMuted" : ""
            }`}
          >
            {isCreatingRound
              ? t("opportunities.matchingRound.notSetUp", {}, {
                  default: "Not set up",
                })
              : displayStatusLabel}
          </span>
        )}
        </div>
      </div>

      {expanded && loading ? (
        <div className="classTabExpandableBody">
          {renderNetworkRow()}
          <div className="classTabEmpty">
            <p>
              {t("opportunities.matchingRound.loading", {}, {
                default: "Loading matching round…",
              })}
            </p>
          </div>
        </div>
      ) : null}

      {expanded && !loading ? (
        <div className="classTabExpandableBody">
          {renderNetworkRow()}

          <Navbar style={{ paddingLeft: 0}}>
            {panelOptions.map((panel) => (
              <NavbarItem
                key={panel.id}
                selected={activePanel === panel.id}
                onClick={() => setActivePanel(panel.id)}
                style={{backgroundColor: activePanel === panel.id ? "#DEF8FB" : "transparent"}}
              >
                {panel.label}
              </NavbarItem>
            ))}
          </Navbar>

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
