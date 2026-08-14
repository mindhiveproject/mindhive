import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import absoluteUrl from "next-absolute-url";
import clsx from "clsx";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import useForm from "../../../../../lib/useForm";
import { classNetworkUrlRef } from "../../../../../lib/classNetworkRef";
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import CopyButton from "../../../../DesignSystem/CopyButton";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import IconButton from "../../../../DesignSystem/IconButton";
import MessageCard from "../../../../DesignSystem/MessageCard";
import Modal from "../../../../DesignSystem/Modal";
import Navbar, { NavbarItem } from "../../../../DesignSystem/Navbar";
import {
  GET_CONNECT_ROUND,
  MY_CONNECT_ROUNDS,
  NETWORK_OPPORTUNITIES_FOR_ROUND,
} from "../../../../Queries/ConnectRound";
import { QUESTION_LIBRARY } from "../../../../Queries/ConnectQuestion";
import {
  ROUND_PICKABLE_FORM_DEFINITIONS,
  CLASS_LIBRARY_FORM_DEFINITIONS,
  PUBLIC_OPPORTUNITY_FORM_DEFINITIONS,
} from "../../../../Queries/FormDefinition";
import {
  CREATE_CONNECT_ROUND,
  UPDATE_CONNECT_ROUND,
} from "../../../../Mutations/ConnectRound";
import {
  CLONE_FORM_DEFINITION_FOR_CLASS,
  DELETE_FORM_DEFINITION,
  PUBLISH_FORM_DEFINITION,
} from "../../../../Mutations/FormDefinition";
import { UPDATE_OPPORTUNITY } from "../../../../Mutations/Opportunity";
import {
  EMPTY_FORM,
  buildSuggestedRoundDefaults,
  toDateInputValue,
  toIsoOrNull,
} from "../../../Connect/Rounds/roundFormConfig";
import { useUser } from "../../../../Utils/Access/User";
import MatchingRoundOpportunitiesGrid from "./MatchingRoundOpportunitiesGrid";
import MatchingRoundFollowUpCompletionGrid from "./MatchingRoundFollowUpCompletionGrid";
import MatchingRoundFormPreviewModal from "./MatchingRoundFormPreviewModal";
import OpportunityExportModal from "./OpportunityExportModal";
import TeacherFormWizard from "../../../../Forms/TeacherFormWizard";

const NETWORK_ICON = (
  <img
    src="/assets/connect/network.svg"
    alt=""
    aria-hidden
    width={18}
    height={18}
  />
);

const ROUND_STATUS_KEYS = {
  draft: "draft",
  preferences_open: "preferencesOpen",
  preferences_closed: "preferencesClosed",
  matching: "matching",
  published: "published",
  archived: "archived",
};

const OPPORTUNITY_STATUS_AT_OR_BEYOND_PRESELECTED = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

const OPPORTUNITY_STATUS_REVERTABLE_ON_ROUND_REMOVE = new Set(["pre_selected"]);

const PANELS = {
  settings: "settings",
  review: "review",
  selected: "selected",
  forms: "forms",
  questions: "questions",
  matches: "matches",
};

/** Portal-safe styles: DesignSystem Modal mounts outside `.classTabPage`. */
const SettingsModalContent = styled.div`
  .classTabMatchingRoundPanel {
    display: grid;
    gap: 18px;
  }

  .classTabMatchingRoundNetworkRow {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #ece9e6;
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-Extra-Light, #f8fafb);

    .matchingRoundNetworkConfirm {
      display: grid;
      gap: 8px;
      min-width: 0;
    }

    .matchingRoundNetworkIdentity {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .matchingRoundNetworkIcon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--MH-Theme-Neutrals-Light, #e6e6e6);

      img {
        width: 20px;
        height: 20px;
      }
    }

    .matchingRoundNetworkIdentityText {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .matchingRoundNetworkTitle {
      margin: 0;
      font-family: "Inter", sans-serif;
      font-size: 15px;
      font-weight: 700;
      line-height: 22px;
      color: #171717;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .matchingRoundNetworkActions {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-start;
      gap: 8px 10px;
      min-width: 0;
      overflow-x: auto;
    }

    .matchingRoundNetworkInviteActions {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .classTabFormGrid {
    display: grid;
    gap: 16px;
  }

  .classTabFormGridTwo {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (max-width: 700px) {
      grid-template-columns: 1fr;
    }
  }

  .classTabFormField {
    display: grid;
    align-content: start;
    gap: 6px;
    font-size: 14px;
    color: #625b71;

    .fieldLabel {
      font-weight: 600;
      color: #171717;
      font-size: 14px;
      line-height: 20px;
    }

    input[type="text"],
    input[type="date"],
    textarea,
    select {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d9d6d2;
      border-radius: 12px;
      background: #ffffff;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      line-height: 20px;
      color: #171717;
      outline: none;
      box-sizing: border-box;

      &:focus-visible {
        border-color: #336f8a;
      }
    }

    textarea {
      min-height: 72px;
      resize: vertical;
    }
  }
`;

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
  const showHint = variant !== "short" && !!hint;
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
          fontSize: isChip || variant === "short" ? "12px" : "14px",
          lineHeight: isChip || variant === "short" ? "16px" : "18px",
          color: "#5f6871",
        }}
      >
        {short}
      </span>
      {showHint ? (
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

/** Origin chip kind for library rows: public template vs class custom vs yours. */
function getFormOriginKind(form, currentUserId) {
  if (form?.section === "public" || form?.scope === "global") {
    return "public";
  }
  if (currentUserId && form?.createdBy?.id === currentUserId) {
    return "owned";
  }
  return "custom";
}

/** Ownership chip kind for a pickable FormDefinition row (legacy option labels). */
function getFormOwnershipKind(form, currentUserId) {
  if (currentUserId && form?.createdBy?.id === currentUserId) {
    return "ownedByMe";
  }
  if (form?.scope === "global") {
    return "public";
  }
  if (form?.scope === "class") {
    return "class";
  }
  return "network";
}

function FormOwnershipOptionLabel({ title, ownershipKind, t }) {
  const chipLabel =
    ownershipKind === "ownedByMe"
      ? t("opportunities.matchingRound.formPicker.chipOwnedByMe", {}, {
          default: "Owned by me",
        })
      : ownershipKind === "public"
        ? t("opportunities.matchingRound.formPicker.chipPublic", {}, {
            default: "Public",
          })
        : ownershipKind === "class"
          ? t("opportunities.matchingRound.formPicker.chipClass", {}, {
              default: "Class",
            })
          : t("opportunities.matchingRound.formPicker.chipNetwork", {}, {
              default: "Network",
            });

  return (
    <span
      className="matchingRoundFormOwnershipOption"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        width: "100%",
        minWidth: 0,
      }}
    >
      <span
        className="matchingRoundFormOwnershipOptionTitle"
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {title}
      </span>
      <Chip
        label={chipLabel}
        shape="pill"
        className="matchingRoundFormOwnershipChip"
        ariaLabel={chipLabel}
        style={{
          height: 22,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 2,
          paddingBottom: 2,
          fontSize: 11,
          fontWeight: 500,
          lineHeight: "16px",
          flexShrink: 0,
        }}
      />
    </span>
  );
}

function buildSnapshot(
  inputs,
  opportunityIds,
  questionIds,
  formDefinitionIds,
  sponsorFormsVisible,
) {
  return {
    title: inputs.title || "",
    description: inputs.description || "",
    status: inputs.status || "draft",
    openAt: inputs.openAt || "",
    closeAt: inputs.closeAt || "",
    opportunities: [...opportunityIds].sort(),
    questions: [...questionIds].sort(),
    formDefinitions: [...(formDefinitionIds || [])].sort(),
    sponsorFormsVisible: Boolean(sponsorFormsVisible),
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
    JSON.stringify(a.opportunities) === JSON.stringify(b.opportunities) &&
    JSON.stringify(a.questions) === JSON.stringify(b.questions) &&
    JSON.stringify(a.formDefinitions) === JSON.stringify(b.formDefinitions) &&
    a.sponsorFormsVisible === b.sponsorFormsVisible
  );
}

function readSponsorFormsVisible(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return false;
  }
  return Boolean(settings.sponsorFormsVisible);
}

function mergeRoundSettings(existing, sponsorFormsVisible) {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? existing
      : {};
  return {
    ...base,
    sponsorFormsVisible: Boolean(sponsorFormsVisible),
  };
}

function sortOpportunitiesByTitle(opportunities) {
  return [...opportunities].sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base",
    }),
  );
}

function NetworkIdentity({ network, t }) {
  if (!network) return null;
  return (
    <div className="matchingRoundNetworkIdentity">
      <span className="matchingRoundNetworkIcon" aria-hidden>
        {NETWORK_ICON}
      </span>
      <div className="matchingRoundNetworkIdentityText">
        <span className="matchingRoundNetworkTitle">{network.title}</span>
      </div>
    </div>
  );
}

function CardShell({
  title,
  titleMuted,
  summaryHint,
  expanded,
  onToggleExpand,
  headerActions,
  children,
  t,
}) {
  return (
    <section className="classTabSection classTabExpandableCard">
      <div className="classTabExpandableHeaderBar">
        <button
          type="button"
          className="classTabExpandableHeaderToggle"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t("opportunities.matchingRound.collapseLabel", {}, {
                  default: "Collapse matching round settings",
                })
              : t("opportunities.matchingRound.expandLabel", {}, {
                  default: "Expand matching round settings",
                })
          }
          onClick={onToggleExpand}
        >
          <div className="expandableHeaderMain">
            <h3 className={titleMuted ? "summaryRoundTitleMuted" : undefined}>
              {title}
            </h3>
            {summaryHint ? (
              <div className="expandableSummaryHint">{summaryHint}</div>
            ) : null}
          </div>
          <img
            src="/assets/icons/expand.svg"
            alt=""
            aria-hidden
            className={`expandableChevron${expanded ? " expanded" : ""}`}
            width={16}
            height={16}
          />
        </button>
        <div className="matchingRoundHeaderActions">{headerActions}</div>
      </div>
      {children}
    </section>
  );
}

function MatchingRoundCollapsedCard({
  roundSummary,
  networks,
  onToggleExpand,
  t,
}) {
  const network =
    roundSummary?.classNetwork ||
    networks.find((n) => n.id === roundSummary?.classNetwork?.id) ||
    null;

  const title =
    roundSummary?.title ||
    t("opportunities.matchingRound.loading", {}, {
      default: "Loading matching round…",
    });

  const statusNode = roundSummary?.status ? (
    <span className="summaryStatus">
      <RoundStatusLabel status={roundSummary.status} t={t} variant="short" />
    </span>
  ) : (
    <span className="summaryStatus summaryStatusMuted">
      {t("opportunities.matchingRound.notSetUp", {}, { default: "Not set up" })}
    </span>
  );

  const networkHint = network?.title ? (
    <Chip
      label={network.title}
      leading={NETWORK_ICON}
      shape="square"
      style={{ color: "#171717", borderColor: "#171717", opacity: 0.7 }}
      ariaLabel={t("opportunities.matchingRound.collapsedNetworkHint", {
        title: network.title,
      }, {
        default: "Class network: {{title}}",
      })}
    />
  ) : null;

  return (
    <CardShell
      title={title}
      summaryHint={networkHint}
      expanded={false}
      onToggleExpand={onToggleExpand}
      headerActions={statusNode}
      t={t}
    />
  );
}

function MatchingRoundEditor({
  myclass,
  networks,
  roundSummary,
  isCreate = false,
  initialNetworkId = null,
  onToggleExpand,
  onRegisterDirtyGuard,
  onPreviewOpportunity,
  onMatchingRoundContextChange,
  onCreated,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { origin } = absoluteUrl();
  const { user } = useUser();

  const roundId = isCreate ? null : roundSummary?.id || null;
  const isNew = !roundId;

  const queryMatchingPanel = useMemo(() => {
    const raw = router.query?.matchingPanel;
    if (typeof raw !== "string" || !Object.values(PANELS).includes(raw)) {
      return null;
    }
    // Matches tab is present but disabled for now — ignore deep links.
    if (raw === PANELS.matches) return null;
    return raw;
  }, [router.query?.matchingPanel]);

  const initialPanel =
    queryMatchingPanel && queryMatchingPanel !== PANELS.settings
      ? queryMatchingPanel
      : PANELS.review;

  const [selectedNetworkId, setSelectedNetworkId] = useState(
    isCreate
      ? initialNetworkId || networks[0]?.id || null
      : roundSummary?.classNetwork?.id || null,
  );
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedFormDefinitionIds, setSelectedFormDefinitionIds] = useState(
    [],
  );
  const [sponsorFormsVisible, setSponsorFormsVisible] = useState(false);
  const [togglingSponsorFormsVisible, setTogglingSponsorFormsVisible] =
    useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [settingsModalOpen, setSettingsModalOpen] = useState(
    () => isNew || queryMatchingPanel === PANELS.settings,
  );
  const [snapshotRevision, setSnapshotRevision] = useState(0);
  const [togglingOpportunityId, setTogglingOpportunityId] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);
  const [formPreviewIds, setFormPreviewIds] = useState([]);
  const [formWizardOpen, setFormWizardOpen] = useState(false);
  const [formWizardDefinitionId, setFormWizardDefinitionId] = useState(null);
  const [librarySelectedId, setLibrarySelectedId] = useState(null);
  const [publicFormsExpanded, setPublicFormsExpanded] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState(null);
  const [cloningPublic, setCloningPublic] = useState(false);
  const [publishAddForm, setPublishAddForm] = useState(null);
  const [publishingAdd, setPublishingAdd] = useState(false);
  const [publishAddError, setPublishAddError] = useState(null);
  const [formsManagerOpen, setFormsManagerOpen] = useState(true);
  const [formWizardBanner, setFormWizardBanner] = useState(null);
  const formsManagerInitializedRef = useRef(false);
  const savedSnapshotRef = useRef(null);

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === selectedNetworkId) || null,
    [networks, selectedNetworkId],
  );

  const { data: roundData, loading: loadingRound } = useQuery(GET_CONNECT_ROUND, {
    variables: { id: roundId },
    skip: !roundId,
    fetchPolicy: "cache-and-network",
  });
  const round = roundData?.connectRound;

  const { inputs, handleChange, handleMultipleUpdate } = useForm(EMPTY_FORM);

  const captureSnapshot = useCallback(
    (
      nextInputs,
      nextOpportunities,
      nextQuestions,
      nextFormDefinitions,
      nextSponsorFormsVisible,
    ) => {
      savedSnapshotRef.current = buildSnapshot(
        nextInputs,
        nextOpportunities,
        nextQuestions,
        nextFormDefinitions,
        nextSponsorFormsVisible,
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
      selectedFormDefinitionIds,
      sponsorFormsVisible,
    );
    return !snapshotsEqual(current, savedSnapshotRef.current);
  }, [
    formInitialized,
    inputs,
    selectedOpportunities,
    selectedQuestions,
    selectedFormDefinitionIds,
    sponsorFormsVisible,
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
    if (!onRegisterDirtyGuard) return;
    onRegisterDirtyGuard(confirmIfDirty);
    return () => onRegisterDirtyGuard(null);
  }, [confirmIfDirty, onRegisterDirtyGuard]);

  useEffect(() => {
    if (!queryMatchingPanel) return;
    if (queryMatchingPanel === PANELS.settings) {
      setSettingsModalOpen(true);
      return;
    }
    setActivePanel(queryMatchingPanel);
  }, [queryMatchingPanel]);

  // Sync network when parent confirms a different network for a draft create card.
  useEffect(() => {
    if (!isCreate || !initialNetworkId) return;
    if (initialNetworkId === selectedNetworkId) return;
    setSelectedNetworkId(initialNetworkId);
    setFormInitialized(false);
    setSelectedOpportunities([]);
    setSelectedQuestions([]);
    setSelectedFormDefinitionIds([]);
    setSponsorFormsVisible(false);
  }, [isCreate, initialNetworkId, selectedNetworkId]);

  useEffect(() => {
    if (isNew) {
      if (formInitialized) return;
      if (!selectedNetworkId) return;
      const suggested = buildSuggestedRoundDefaults(
        myclass?.title,
        selectedNetwork?.title,
      );
      const defaults = {
        title: suggested.title || "",
        description: suggested.description || "",
        status: suggested.status || "draft",
        openAt: suggested.openAt || "",
        closeAt: suggested.closeAt || "",
      };
      handleMultipleUpdate(defaults);
      setSelectedOpportunities([]);
      setSelectedQuestions([]);
      setSelectedFormDefinitionIds([]);
      setSponsorFormsVisible(false);
      setFormInitialized(true);
      captureSnapshot(defaults, [], [], [], false);
      return;
    }

    if (!roundId) return;
    if (!round || round.id !== roundId) return;
    if (formInitialized) return;

    const nextInputs = {
      title: round.title || "",
      description: round.description || "",
      status: round.status || "draft",
      openAt: toDateInputValue(round.openAt),
      closeAt: toDateInputValue(round.closeAt),
    };
    const nextOpportunities = (round.opportunities || []).map((o) => o.id);
    const nextQuestions = (round.questions || []).map((q) => q.id);
    const nextFormDefinitions = (round.formDefinitions || []).map((f) => f.id);
    const nextSponsorFormsVisible = readSponsorFormsVisible(round.settings);

    if (round.classNetwork?.id && round.classNetwork.id !== selectedNetworkId) {
      setSelectedNetworkId(round.classNetwork.id);
    }

    handleMultipleUpdate(nextInputs);
    setSelectedOpportunities(nextOpportunities);
    setSelectedQuestions(nextQuestions);
    setSelectedFormDefinitionIds(nextFormDefinitions);
    setSponsorFormsVisible(nextSponsorFormsVisible);
    setFormInitialized(true);
    captureSnapshot(
      nextInputs,
      nextOpportunities,
      nextQuestions,
      nextFormDefinitions,
      nextSponsorFormsVisible,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isNew,
    round?.id,
    roundId,
    selectedNetworkId,
    formInitialized,
    myclass?.title,
    selectedNetwork?.title,
  ]);

  useEffect(() => {
    formsManagerInitializedRef.current = false;
    setFormsManagerOpen(true);
  }, [roundId, isNew]);

  useEffect(() => {
    if (!formInitialized) return;
    if (!formsManagerInitializedRef.current) {
      formsManagerInitializedRef.current = true;
      setFormsManagerOpen(selectedFormDefinitionIds.length === 0);
      return;
    }
    if (selectedFormDefinitionIds.length === 0) {
      setFormsManagerOpen(true);
    }
  }, [formInitialized, selectedFormDefinitionIds.length]);

  const { data: libraryData } = useQuery(QUESTION_LIBRARY, {
    fetchPolicy: "cache-and-network",
  });
  const libraryQuestions = (libraryData?.connectQuestions || []).filter(
    (q) => q.status === "approved",
  );

  const { data: pickableFormsData, refetch: refetchPickableForms } = useQuery(
    ROUND_PICKABLE_FORM_DEFINITIONS,
    {
      variables: {
        classNetworkId: selectedNetworkId,
        classId: myclass?.id,
      },
      skip: !selectedNetworkId || !myclass?.id,
      fetchPolicy: "cache-and-network",
    },
  );
  // Memoised because these lists feed formLabelsById, which the round-context
  // effect below depends on. A skipped query leaves data undefined, so a bare
  // `|| []` would hand out a new array every render and republish the context
  // forever.
  const pickableFormDefinitions = useMemo(
    () => pickableFormsData?.formDefinitions || [],
    [pickableFormsData?.formDefinitions],
  );

  const { data: classLibraryFormsData, refetch: refetchClassLibraryForms } =
    useQuery(CLASS_LIBRARY_FORM_DEFINITIONS, {
      variables: {
        classId: myclass?.id,
      },
      skip: !myclass?.id,
      fetchPolicy: "cache-and-network",
    });
  const classLibraryFormDefinitions = useMemo(
    () => classLibraryFormsData?.formDefinitions || [],
    [classLibraryFormsData?.formDefinitions],
  );

  const { data: publicFormsData, refetch: refetchPublicForms } = useQuery(
    PUBLIC_OPPORTUNITY_FORM_DEFINITIONS,
    {
      skip: !publicFormsExpanded,
      fetchPolicy: "cache-and-network",
    },
  );
  const publicFormDefinitions = useMemo(
    () => publicFormsData?.formDefinitions || [],
    [publicFormsData?.formDefinitions],
  );

  // Drop library selection if the form disappears after refetch/delete.
  useEffect(() => {
    if (!librarySelectedId) return;
    if (!classLibraryFormsData) return;
    const stillPresent =
      classLibraryFormDefinitions.some((form) => form.id === librarySelectedId) ||
      selectedFormDefinitionIds.includes(librarySelectedId) ||
      publicFormDefinitions.some((form) => form.id === librarySelectedId) ||
      (round?.formDefinitions || []).some(
        (form) => form.id === librarySelectedId,
      );
    if (!stillPresent) {
      setLibrarySelectedId(null);
    }
  }, [
    classLibraryFormsData,
    classLibraryFormDefinitions,
    selectedFormDefinitionIds,
    publicFormDefinitions,
    round?.formDefinitions,
    librarySelectedId,
  ]);
  const formDefinitionOptions = useMemo(() => {
    const byId = new Map();
    const currentUserId = user?.id;

    const toOption = (form) => {
      const title = form.title || form.id;
      const ownershipKind = getFormOwnershipKind(form, currentUserId);
      return {
        value: form.id,
        labelText: title,
        label: (
          <FormOwnershipOptionLabel
            title={title}
            ownershipKind={ownershipKind}
            t={t}
          />
        ),
      };
    };

    for (const form of pickableFormDefinitions) {
      byId.set(form.id, toOption(form));
    }
    for (const form of round?.formDefinitions || []) {
      if (!byId.has(form.id)) {
        byId.set(form.id, toOption(form));
      }
    }
    return Array.from(byId.values());
  }, [pickableFormDefinitions, round?.formDefinitions, user?.id, t]);

  const formLabelsById = useMemo(() => {
    const map = {};
    for (const option of formDefinitionOptions) {
      map[option.value] = option.labelText || option.label;
    }
    for (const form of classLibraryFormDefinitions) {
      if (!map[form.id]) {
        map[form.id] = form.title || form.id;
      }
    }
    for (const form of publicFormDefinitions) {
      if (!map[form.id]) {
        map[form.id] = form.title || form.id;
      }
    }
    return map;
  }, [
    formDefinitionOptions,
    classLibraryFormDefinitions,
    publicFormDefinitions,
  ]);

  const refetchFormLists = useCallback(async () => {
    await Promise.all([
      refetchPickableForms?.(),
      refetchClassLibraryForms?.(),
      publicFormsExpanded ? refetchPublicForms?.() : Promise.resolve(),
    ]);
  }, [
    refetchPickableForms,
    refetchClassLibraryForms,
    refetchPublicForms,
    publicFormsExpanded,
  ]);

  const { data: opportunitiesData } = useQuery(NETWORK_OPPORTUNITIES_FOR_ROUND, {
    variables: { classNetworkId: selectedNetworkId },
    skip: !selectedNetworkId,
    fetchPolicy: "cache-and-network",
  });

  const networkOpportunities = useMemo(
    () => opportunitiesData?.opportunities || [],
    [opportunitiesData?.opportunities],
  );

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
            variables: { id, input: { status: "pre_selected" } },
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
            variables: { id, input: { status: "pending_review" } },
          }),
        ),
      );
    },
    [networkOpportunities, updateOpportunity],
  );

  const selectedNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) =>
        selectedSet.has(opportunity.id),
      ),
    );
  }, [networkOpportunities, selectedOpportunities]);

  const reviewNetworkOpportunities = useMemo(() => {
    const selectedSet = new Set(selectedOpportunities);
    return sortOpportunitiesByTitle(
      networkOpportunities.filter((opportunity) => {
        if (selectedSet.has(opportunity.id)) return false;
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

  const settingsLabel = t("opportunities.matchingRound.panels.settings", {}, {
    default: "Settings",
  });
  const exportLabel = t("opportunities.matchingRound.export.openButton", {}, {
    default: "Export to CSV",
  });

  const panelOptions = useMemo(
    () => [
      {
        id: PANELS.review,
        label:
          reviewOpportunitiesCount > 0
            ? t(
                "opportunities.matchingRound.panels.availableWithCount",
                { count: reviewOpportunitiesCount },
                { default: "Available ({{count}})" },
              )
            : t("opportunities.matchingRound.panels.available", {}, {
                default: "Available",
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
        id: PANELS.forms,
        label: t("opportunities.matchingRound.panels.followUp", {}, {
          default: "Follow-up",
        }),
      },
      // {
      //   id: PANELS.questions,
      //   label: t("opportunities.matchingRound.panels.questions", {}, {
      //     default: "Student questions",
      //   }),
      // },
        // {
        //   id: PANELS.matches,
        //   label: t("opportunities.matchingRound.panels.manageMatches", {}, {
        //     default: "Manage matches",
        //   }),
        //   disabled: true,
        // },
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
        ...(roundId
          ? [{ query: GET_CONNECT_ROUND, variables: { id: roundId } }]
          : []),
      ],
      awaitRefetchQueries: true,
    },
  );
  const [deleteFormDefinition] = useMutation(DELETE_FORM_DEFINITION);
  const [cloneFormForClass] = useMutation(CLONE_FORM_DEFINITION_FOR_CLASS);
  const [publishFormDefinition] = useMutation(PUBLISH_FORM_DEFINITION);
  const saving = creating || updating;

  const persistOpportunitySelection = useCallback(
    async (nextIds, togglingId = null) => {
      const sortedCurrent = [...selectedOpportunities].sort();
      const sortedNext = [...nextIds].sort();
      if (JSON.stringify(sortedCurrent) === JSON.stringify(sortedNext)) return;

      const previousSet = new Set(selectedOpportunities);
      const nextSet = new Set(nextIds);
      const newlySelectedIds = nextIds.filter((id) => !previousSet.has(id));
      const newlyRemovedIds = selectedOpportunities.filter(
        (id) => !nextSet.has(id),
      );

      if (isNew || !roundId) {
        setSelectedOpportunities(nextIds);
        return;
      }

      if (togglingOpportunityId) return;

      setTogglingOpportunityId(togglingId);
      try {
        await updateConnectRound({
          variables: {
            id: roundId,
            input: {
              opportunities: { set: nextIds.map((id) => ({ id })) },
              updatedAt: new Date().toISOString(),
            },
          },
        });
        await markOpportunitiesPreSelected(newlySelectedIds);
        await markOpportunitiesPendingReview(newlyRemovedIds);
        setSelectedOpportunities(nextIds);
        captureSnapshot(
          inputs,
          nextIds,
          selectedQuestions,
          selectedFormDefinitionIds,
          sponsorFormsVisible,
        );
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
      roundId,
      togglingOpportunityId,
      updateConnectRound,
      markOpportunitiesPreSelected,
      markOpportunitiesPendingReview,
      inputs,
      selectedQuestions,
      selectedFormDefinitionIds,
      sponsorFormsVisible,
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
        // Grid resyncs from selectedOpportunities.
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
        // Selection unchanged on failure.
      }
    },
    [selectedOpportunities, persistOpportunitySelection],
  );

  const persistFormDefinitionSelection = useCallback(
    async (nextIds) => {
      const sortedCurrent = [...selectedFormDefinitionIds].sort();
      const sortedNext = [...(nextIds || [])].sort();
      if (JSON.stringify(sortedCurrent) === JSON.stringify(sortedNext)) return;

      setSelectedFormDefinitionIds(nextIds);

      if (isNew || !roundId) {
        return;
      }

      try {
        await updateConnectRound({
          variables: {
            id: roundId,
            input: {
              formDefinitions: {
                set: (nextIds || []).map((id) => ({ id })),
              },
              updatedAt: new Date().toISOString(),
            },
          },
        });
        captureSnapshot(
          inputs,
          selectedOpportunities,
          selectedQuestions,
          nextIds,
          sponsorFormsVisible,
        );
      } catch (error) {
        console.error("Failed to update matching round form definitions", error);
        setSelectedFormDefinitionIds(selectedFormDefinitionIds);
        alert(
          t("opportunities.matchingRound.formPicker.saveFailed", {}, {
            default:
              "Could not save questionnaires for this matching round. Please try again.",
          }),
        );
      }
    },
    [
      selectedFormDefinitionIds,
      isNew,
      roundId,
      updateConnectRound,
      inputs,
      selectedOpportunities,
      selectedQuestions,
      sponsorFormsVisible,
      captureSnapshot,
      t,
    ],
  );

  const toggleQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
        }),
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
        }),
      )
    ) {
      return;
    }

    const nextInputs = { ...inputs, status: value };
    handleMultipleUpdate({ status: value });

    if (isNew || !roundId) return;

    try {
      await updateConnectRound({
        variables: {
          id: roundId,
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
        selectedFormDefinitionIds,
        sponsorFormsVisible,
      );
    } catch {
      handleMultipleUpdate({ status: previousStatus });
    }
  };

  const handleToggleSponsorFormsVisible = async () => {
    if (!canManageOpportunities || togglingSponsorFormsVisible) return;
    if (selectedFormDefinitionIds.length === 0) return;

    const nextVisible = !sponsorFormsVisible;
    const previousVisible = sponsorFormsVisible;
    setSponsorFormsVisible(nextVisible);

    if (isNew || !roundId) {
      return;
    }

    // Persist both visibility and the selected FormDefinition ↔ ConnectRound
    // links. Visibility alone used to update settings without connecting
    // forms, so sponsors never saw the follow-up questionnaires.
    const formDefinitionsConnect = selectedFormDefinitionIds.map((id) => ({
      id,
    }));

    setTogglingSponsorFormsVisible(true);
    try {
      await updateConnectRound({
        variables: {
          id: roundId,
          input: {
            formDefinitions: { set: formDefinitionsConnect },
            settings: mergeRoundSettings(round?.settings, nextVisible),
            updatedAt: new Date().toISOString(),
          },
        },
      });
      captureSnapshot(
        inputs,
        selectedOpportunities,
        selectedQuestions,
        selectedFormDefinitionIds,
        nextVisible,
      );
    } catch (error) {
      console.error("Failed to update sponsor form visibility", error);
      setSponsorFormsVisible(previousVisible);
      alert(
        t("opportunities.matchingRound.formPicker.visibilityToggleFailed", {}, {
          default:
            "Could not update form visibility for sponsors. Please try again.",
        }),
      );
    } finally {
      setTogglingSponsorFormsVisible(false);
    }
  };

  const handleDeleteClassForm = async (form) => {
    if (
      !form?.id ||
      !canManageOpportunities ||
      !canManageClassForms ||
      deletingFormId
    ) {
      return;
    }
    const title = form.title || form.id;
    if (
      !window.confirm(
        t(
          "opportunities.matchingRound.formPicker.deleteConfirm",
          { title },
          {
            default:
              "Delete “{{title}}”? This cannot be undone. It will also be removed from this round if attached.",
          },
        ),
      )
    ) {
      return;
    }

    setDeletingFormId(form.id);
    try {
      if (selectedFormDefinitionIds.includes(form.id)) {
        await persistFormDefinitionSelection(
          selectedFormDefinitionIds.filter((id) => id !== form.id),
        );
      }
      await deleteFormDefinition({ variables: { id: form.id } });
      if (librarySelectedId === form.id) {
        setLibrarySelectedId(null);
      }
      try {
        await refetchFormLists();
      } catch {
        // Lists may refresh on next load.
      }
    } catch (error) {
      console.error("Failed to delete form definition", error);
      alert(
        t("opportunities.matchingRound.formPicker.deleteFailed", {}, {
          default: "Could not delete that form. Please try again.",
        }),
      );
    } finally {
      setDeletingFormId(null);
    }
  };

  const handleClonePublicForm = async (publicForm) => {
    if (!publicForm?.id || !myclass?.id || !canManageOpportunities || cloningPublic) {
      return;
    }
    setCloningPublic(true);
    try {
      const result = await cloneFormForClass({
        variables: { sourceId: publicForm.id, classId: myclass.id },
      });
      const cloned = result?.data?.cloneFormDefinitionForClass;
      if (!cloned?.id) throw new Error("Clone failed");
      try {
        await refetchFormLists();
      } catch {
        // Selection still proceeds.
      }
      setLibrarySelectedId(cloned.id);
      setFormWizardDefinitionId(cloned.id);
      setFormWizardOpen(true);
    } catch (error) {
      console.error("Failed to clone public form", error);
      alert(
        t("opportunities.matchingRound.formPicker.cloneFailed", {}, {
          default: "Could not copy that form. Please try again.",
        }),
      );
    } finally {
      setCloningPublic(false);
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
    const formDefinitionsConnect = selectedFormDefinitionIds.map((id) => ({
      id,
    }));
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
              matchingAlgorithm: "stable_matching",
              opportunities: opportunitiesConnect.length
                ? { connect: opportunitiesConnect }
                : undefined,
              questions: questionsConnect.length
                ? { connect: questionsConnect }
                : undefined,
              formDefinitions: formDefinitionsConnect.length
                ? { connect: formDefinitionsConnect }
                : undefined,
              settings: mergeRoundSettings(null, sponsorFormsVisible),
            },
          },
        });
        const newId = result?.data?.createConnectRound?.id;
        if (newId) {
          await markOpportunitiesPreSelected(newlySelectedOpportunityIds);
          captureSnapshot(
            inputs,
            selectedOpportunities,
            selectedQuestions,
            selectedFormDefinitionIds,
            sponsorFormsVisible,
          );
          if (onCreated) onCreated(newId);
        }
      } else {
        await updateConnectRound({
          variables: {
            id: roundId,
            input: {
              title: inputs.title,
              description: inputs.description || "",
              status: inputs.status || "draft",
              openAt: toIsoOrNull(inputs.openAt),
              closeAt: toIsoOrNull(inputs.closeAt),
              opportunities: { set: opportunitiesConnect },
              questions: { set: questionsConnect },
              formDefinitions: { set: formDefinitionsConnect },
              settings: mergeRoundSettings(round?.settings, sponsorFormsVisible),
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
        captureSnapshot(
          inputs,
          selectedOpportunities,
          selectedQuestions,
          selectedFormDefinitionIds,
          sponsorFormsVisible,
        );
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

  const loading = (!isNew && loadingRound) || !formInitialized;

  const displayRoundTitle =
    roundSummary?.title ||
    round?.title ||
    (formInitialized && !isNew && inputs.title?.trim() ? inputs.title : null);

  const canManageOpportunities = Boolean(
    selectedNetworkId &&
      formInitialized &&
      !loading &&
      roundId &&
      !isNew,
  );

  const canManageClassForms = Boolean(
    user?.id &&
      (myclass?.creator?.id === user.id ||
        (myclass?.mentors || []).some((m) => m?.id === user.id)),
  );

  const toggleOpportunityInRound = useCallback(
    async (opportunityId) => {
      if (togglingOpportunityId) return false;
      const isCurrentlySelected = selectedOpportunities.includes(opportunityId);
      const nextIds = isCurrentlySelected
        ? selectedOpportunities.filter((id) => id !== opportunityId)
        : [...selectedOpportunities, opportunityId];
      try {
        await persistOpportunitySelection(nextIds, opportunityId);
        return true;
      } catch {
        // Keep previous selection. persistOpportunitySelection already alerts.
        return false;
      }
    },
    [selectedOpportunities, togglingOpportunityId, persistOpportunitySelection],
  );

  useEffect(() => {
    if (!onMatchingRoundContextChange) return;
    onMatchingRoundContextChange({
      roundTitle: displayRoundTitle,
      activeRoundId: roundId,
      selectedNetworkId,
      selectedOpportunityIds: selectedOpportunities,
      canManageOpportunities,
      noRoundForNetwork: false,
      togglingOpportunityId,
      toggleOpportunity: toggleOpportunityInRound,
      formDefinitions: selectedFormDefinitionIds.map((id) => {
        const fromRound = (round?.formDefinitions || []).find(
          (fd) => fd.id === id,
        );
        return {
          id,
          title: formLabelsById[id] || fromRound?.title || id,
          key: fromRound?.key,
          version: fromRound?.version,
          status: fromRound?.status || "published",
        };
      }),
    });
    return () => onMatchingRoundContextChange(null);
  }, [
    onMatchingRoundContextChange,
    displayRoundTitle,
    roundId,
    selectedNetworkId,
    selectedOpportunities,
    canManageOpportunities,
    togglingOpportunityId,
    toggleOpportunityInRound,
    selectedFormDefinitionIds,
    formLabelsById,
    round?.formDefinitions,
  ]);

  const cardHeaderTitle = isNew
    ? t("opportunities.matchingRound.newRoundTitle", {}, {
        default: "New matching round",
      })
    : displayRoundTitle ||
      t("opportunities.matchingRound.loading", {}, {
        default: "Loading matching round…",
      });

  const displayStatus = formInitialized
    ? inputs.status
    : roundSummary?.status || round?.status;

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
    background: isNew ? "#f5f0e8" : "#f0f4f6",
    color: isNew ? "#8a6d3b" : "#5f6871",
  };

  const selectedNetworkShareRef = classNetworkUrlRef(selectedNetwork);
  const sponsorSignupAndInviteLink = selectedNetworkShareRef
    ? `${origin}/signup/sponsor?classNetwork=${selectedNetworkShareRef}`
    : "";
  const sponsorNetworkInviteLink = selectedNetworkShareRef
    ? `${origin}/login?classNetwork=${selectedNetworkShareRef}`
    : "";

  const headerActions =
    formInitialized && !loading ? (
      <DropdownSelect
        fitContent
        value={inputs.status || "draft"}
        options={statusOptions}
        onChange={handleStatusChange}
        disabled={updating}
        ariaLabel={t("opportunities.matchingRound.fields.status", {}, {
          default: "Status",
        })}
        triggerStyle={statusChipTriggerStyle}
      />
    ) : displayStatus ? (
      <span className={`summaryStatus${isNew ? " summaryStatusMuted" : ""}`}>
        <RoundStatusLabel status={displayStatus} t={t} variant="chip" />
      </span>
    ) : (
      <span className="summaryStatus summaryStatusMuted">
        {t("opportunities.matchingRound.notSetUp", {}, { default: "Not set up" })}
      </span>
    );

  const renderNetworkRow = () => (
    <div className="classTabMatchingRoundNetworkRow">
      <div className="matchingRoundNetworkConfirm">
        <NetworkIdentity network={selectedNetwork} t={t} />
      </div>

      {selectedNetworkShareRef && !isNew ? (
        <div className="matchingRoundNetworkActions">
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
        </div>
      ) : null}
    </div>
  );

  const renderSettingsPanel = () => (
    <div className="classTabMatchingRoundPanel">
      {renderNetworkRow()}

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
    </div>
  );

  const renderReviewPanel = () => (
    <div className="classTabMatchingRoundPanel">
      {/* <p className="subsectionHint">
        {t("opportunities.matchingRound.fields.opportunitiesHint", {}, {
          default:
            "Select which published opportunities students can rank in this round.",
        })}
      </p> */}
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
          roundId={roundId}
          emptyMessage={t("opportunities.matchingRound.reviewOpportunitiesEmpty", {}, {
            default:
              "All network opportunities are already in this round. Remove some from Selected opportunities to review more.",
          })}
        />
      )}
    </div>
  );

  const renderFormsPanel = () => {
    const libraryBusy =
      saving || cloningPublic || Boolean(deletingFormId) || publishingAdd;

    const openCreateWizard = () => {
      setFormWizardDefinitionId(null);
      setFormWizardOpen(true);
    };
    const openEditWizard = (formId) => {
      if (!formId) return;
      setLibrarySelectedId(formId);
      setFormWizardDefinitionId(formId);
      setFormWizardOpen(true);
    };
    const openPreview = (formId) => {
      if (!formId) return;
      setLibrarySelectedId(formId);
      setFormPreviewIds([formId]);
      setFormPreviewOpen(true);
    };
    const addFormToRound = (formId) => {
      if (!formId || !canManageOpportunities || saving || publishingAdd) return;
      if (selectedFormDefinitionIds.includes(formId)) return;
      persistFormDefinitionSelection([
        ...selectedFormDefinitionIds,
        formId,
      ]);
    };
    const requestAddFormToRound = (form) => {
      if (!form?.id || !canManageOpportunities || libraryBusy) return;
      if (form.status === "draft") {
        setPublishAddError(null);
        setPublishAddForm({
          id: form.id,
          title: form.title || form.id,
        });
        return;
      }
      addFormToRound(form.id);
    };
    const closePublishAddModal = () => {
      if (publishingAdd) return;
      setPublishAddForm(null);
      setPublishAddError(null);
    };
    const confirmPublishAndAdd = async () => {
      const formId = publishAddForm?.id;
      if (!formId || !canManageOpportunities || publishingAdd) return;
      setPublishingAdd(true);
      setPublishAddError(null);
      try {
        await publishFormDefinition({ variables: { id: formId } });
        try {
          await refetchFormLists();
        } catch {
          // Selection still proceeds; lists may refresh on next load.
        }
        if (!selectedFormDefinitionIds.includes(formId)) {
          await persistFormDefinitionSelection([
            ...selectedFormDefinitionIds,
            formId,
          ]);
        }
        setPublishAddForm(null);
      } catch (error) {
        console.error("Failed to publish and add form", error);
        setPublishAddError(
          t(
            "opportunities.matchingRound.formPicker.publishAddModal.failed",
            {},
            { default: "Could not publish that form. Please try again." },
          ),
        );
      } finally {
        setPublishingAdd(false);
      }
    };
    const removeFormFromRound = (formId) => {
      if (!formId || !canManageOpportunities || saving) return;
      if (!selectedFormDefinitionIds.includes(formId)) return;
      persistFormDefinitionSelection(
        selectedFormDefinitionIds.filter((id) => id !== formId),
      );
    };

    const formsById = new Map();
    for (const form of pickableFormDefinitions) {
      formsById.set(form.id, form);
    }
    for (const form of classLibraryFormDefinitions) {
      formsById.set(form.id, form);
    }
    for (const form of publicFormDefinitions) {
      formsById.set(form.id, {
        ...form,
        scope: form.scope || "global",
        status: form.status || "published",
      });
    }
    for (const form of round?.formDefinitions || []) {
      if (!formsById.has(form.id)) {
        formsById.set(form.id, form);
      }
    }

    const inRoundForms = selectedFormDefinitionIds
      .map((id) => {
        const form = formsById.get(id);
        if (!form) {
          return {
            id,
            title: formLabelsById[id] || id,
            status: "published",
            scope: "global",
          };
        }
        return {
          ...form,
          status: form.status || "published",
        };
      })
      .filter(Boolean);

    const selectedFormIdSet = new Set(selectedFormDefinitionIds);

    const classLibraryForms = classLibraryFormDefinitions
      .filter((form) => !selectedFormIdSet.has(form.id))
      .map((form) => ({
        ...form,
        section: "class",
      }));

    const publicForms = publicFormDefinitions
      .filter((form) => !selectedFormIdSet.has(form.id))
      .map((form) => ({
        ...form,
        scope: "global",
        status: "published",
        section: "public",
      }));

    const buildInRoundMenuItems = (form) => [
      {
        key: "preview",
        label: t(
          "opportunities.matchingRound.formPicker.previewButton",
          {},
          { default: "Preview" },
        ),
        onClick: () => openPreview(form.id),
      },
      {
        key: "remove",
        label: t(
          "opportunities.matchingRound.formPicker.removeFromRound",
          {},
          { default: "Remove from this round" },
        ),
        onClick: () => removeFormFromRound(form.id),
      },
    ];

    const buildClassLibraryMenuItems = (form) => {
      const items = [];

      if (canManageOpportunities && canManageClassForms) {
        items.push({
          key: "edit",
          label: t(
            "opportunities.matchingRound.formPicker.editButton",
            {},
            { default: "Edit form" },
          ),
          onClick: () => openEditWizard(form.id),
        });
      }

      items.push({
        key: "preview",
        label: t(
          "opportunities.matchingRound.formPicker.previewButton",
          {},
          { default: "Preview" },
        ),
        onClick: () => openPreview(form.id),
      });

      if (canManageOpportunities && canManageClassForms) {
        items.push({
          key: "delete",
          label: t(
            "opportunities.matchingRound.formPicker.deleteButton",
            {},
            { default: "Delete form" },
          ),
          danger: true,
          onClick: () => handleDeleteClassForm(form),
        });
      }
      return items;
    };

    const buildPublicMenuItems = (form) => [
      {
        key: "preview",
        label: t(
          "opportunities.matchingRound.formPicker.previewButton",
          {},
          { default: "Preview" },
        ),
        onClick: () => openPreview(form.id),
      },
      {
        key: "copy",
        label: t(
          "opportunities.matchingRound.formPicker.copyIntoClassLibrary",
          {},
          { default: "Copy into class library" },
        ),
        onClick: () => handleClonePublicForm(form),
      },
    ];

    const chipStyle = {
      height: 22,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 2,
      paddingBottom: 2,
      fontSize: 11,
      fontWeight: 500,
      lineHeight: "16px",
      flexShrink: 0,
    };

    const getOriginChip = (form) => {
      const originKind = getFormOriginKind(form, user?.id);
      if (originKind === "public") {
        const label = t(
          "opportunities.matchingRound.formPicker.originPublic",
          {},
          { default: "Public" },
        );
        return (
          <Chip
            label={label}
            shape="pill"
            className={clsx(
              "matchingRoundFormOwnershipChip",
              "matchingRoundFormOriginChip--public",
            )}
            ariaLabel={label}
            style={chipStyle}
          />
        );
      }
      if (originKind === "owned") {
        const label = t(
          "opportunities.matchingRound.formPicker.originOwnedByMe",
          {},
          { default: "Yours" },
        );
        return (
          <Chip
            label={label}
            shape="pill"
            className={clsx(
              "matchingRoundFormOwnershipChip",
              "matchingRoundFormOriginChip--owned",
            )}
            ariaLabel={label}
            style={chipStyle}
          />
        );
      }
      const label = t(
        "opportunities.matchingRound.formPicker.originCustom",
        {},
        { default: "Custom" },
      );
      return (
        <Chip
          label={label}
          shape="pill"
          className={clsx(
            "matchingRoundFormOwnershipChip",
            "matchingRoundFormOriginChip--custom",
          )}
          ariaLabel={label}
          style={chipStyle}
        />
      );
    };

    const renderFormRow = (form, { menuItems, showAddToRound = false }) => {
      const selected = librarySelectedId === form.id;
      const canAddToRound =
        showAddToRound && canManageOpportunities && !libraryBusy;
      const addToRoundLabel = t(
        "opportunities.matchingRound.formPicker.addToRound",
        {},
        { default: "Add to this round" },
      );
      const statusLabel =
        form.status === "draft"
          ? t(
              "opportunities.matchingRound.formPicker.statusDraft",
              {},
              { default: "Draft" },
            )
          : t(
              "opportunities.matchingRound.formPicker.statusPublished",
              {},
              { default: "Published" },
            );

      return (
        <li
          key={form.id}
          className={clsx(
            "matchingRoundFormPickerLibraryRow",
            selected && "selected",
            deletingFormId === form.id && "busy",
          )}
        >
          <button
            type="button"
            className="matchingRoundFormPickerLibraryRowSelect"
            onClick={() =>
              setLibrarySelectedId((prev) =>
                prev === form.id ? null : form.id,
              )
            }
            aria-pressed={selected}
            disabled={libraryBusy}
          >
            <span className="matchingRoundFormPickerLibraryRowMain">
              <span className="matchingRoundFormPickerLibraryRowTitle">
                {form.title || form.id}
              </span>
              <span className="matchingRoundFormPickerLibraryRowMeta">
                {statusLabel}
              </span>
            </span>
            <span className="matchingRoundFormPickerRowChips">
              {getOriginChip(form)}
            </span>
          </button>
          <div
            className="matchingRoundFormPickerLibraryRowActions"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {showAddToRound ? (
              <Button
                type="button"
                variant="subtle"
                className="matchingRoundFormPickerAddButton"
                disabled={!canAddToRound}
                onClick={() => requestAddFormToRound(form)}
              >
                {addToRoundLabel}
              </Button>
            ) : null}
            <DropdownMenu
              ariaLabel={t(
                "opportunities.matchingRound.formPicker.libraryRowMenuAria",
                { title: form.title || form.id },
                { default: "Actions for {{title}}" },
              )}
              items={menuItems}
              triggerStyle={{
                opacity: libraryBusy ? 0.5 : 1,
                pointerEvents: libraryBusy ? "none" : "auto",
                border: "none",
                background:
                  "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
              }}
            />
          </div>
        </li>
      );
    };

    return (
      <div className="classTabMatchingRoundPanel">
        {formWizardBanner ? (
          <MessageCard
            variant="success"
            message={formWizardBanner}
            onClose={() => setFormWizardBanner(null)}
            closeAriaLabel={t(
              "opportunities.matchingRound.formWizard.bannerDismiss",
              {},
              { default: "Dismiss" },
            )}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {formsManagerOpen ? (
        <div className="matchingRoundFormPicker">
          <div className="matchingRoundFormPickerHeader matchingRoundFormPickerHeaderWithToggle">
            <div className="matchingRoundFormPickerHeaderCopy">
              <h4 className="matchingRoundFormPickerTitle">
                {t("opportunities.matchingRound.formPicker.title", {}, {
                  default: "Sponsor follow-up questionnaires",
                })}
              </h4>
              <p className="matchingRoundFormPickerHint">
                {t("opportunities.matchingRound.formPicker.hint", {}, {
                  default:
                    "Attach questionnaires from the shared class library to this round, then choose when sponsors can respond.",
                })}
              </p>
            </div>
            {selectedFormDefinitionIds.length > 0 ? (
              <Button
                type="button"
                variant="text"
                className="matchingRoundFormPickerCollapse"
                onClick={() => setFormsManagerOpen(false)}
              >
                {t(
                  "opportunities.matchingRound.followUpCompletion.hideFormsManager",
                  {},
                  { default: "Hide questionnaires" },
                )}
              </Button>
            ) : null}
          </div>

          <section className="matchingRoundFormPickerSection matchingRoundFormPickerSectionInRound">
            <div className="matchingRoundFormPickerSectionHeader matchingRoundFormPickerLibraryHeader">
              <div className="matchingRoundFormPickerSectionCopy">
                <h5 className="matchingRoundFormPickerSectionTitle">
                  {t(
                    "opportunities.matchingRound.formPicker.roundSetTitle",
                    {},
                    { default: "Forms in this round" },
                  )}
                </h5>
                <p className="matchingRoundFormPickerSectionHint">
                  {t(
                    "opportunities.matchingRound.formPicker.roundSetHint",
                    {},
                    {
                      default:
                        "Questionnaires attached for sponsors in this matching round.",
                    },
                  )}
                </p>
              </div>
              <div className="matchingRoundFormPickerLibraryToolbar">
                <div
                  className={clsx(
                    "matchingRoundFormPickerLibraryVisibility",
                    sponsorFormsVisible && "isVisible",
                  )}
                >
                  <span
                    className={clsx(
                      "matchingRoundFormPickerVisibilityStatus",
                      sponsorFormsVisible ? "isVisible" : "isHidden",
                    )}
                  >
                    {sponsorFormsVisible
                      ? t(
                          "opportunities.matchingRound.formPicker.visibilityVisible",
                          {},
                          { default: "Visible to sponsors" },
                        )
                      : t(
                          "opportunities.matchingRound.formPicker.visibilityHidden",
                          {},
                          { default: "Hidden from sponsors" },
                        )}
                  </span>
                  <Button
                    type="button"
                    variant={sponsorFormsVisible ? "outline" : "filled"}
                    className="matchingRoundFormPickerVisibilityButton"
                    disabled={
                      !canManageOpportunities ||
                      saving ||
                      togglingSponsorFormsVisible ||
                      selectedFormDefinitionIds.length === 0
                    }
                    onClick={handleToggleSponsorFormsVisible}
                  >
                    {sponsorFormsVisible
                      ? t(
                          "opportunities.matchingRound.formPicker.hideFromSponsors",
                          {},
                          { default: "Hide from sponsors" },
                        )
                      : t(
                          "opportunities.matchingRound.formPicker.showToSponsors",
                          {},
                          { default: "Show to sponsors" },
                        )}
                  </Button>
                </div>
              </div>
            </div>

            {inRoundForms.length === 0 ? (
              <p className="matchingRoundFormPickerLibraryEmpty">
                {t(
                  "opportunities.matchingRound.formPicker.roundSetEmpty",
                  {},
                  {
                    default:
                      "No questionnaires attached yet. Add forms from the class library below.",
                  },
                )}
              </p>
            ) : (
              <ul className="matchingRoundFormPickerLibraryList">
                {inRoundForms.map((form) =>
                  renderFormRow(form, {
                    menuItems: buildInRoundMenuItems(form),
                  }),
                )}
              </ul>
            )}
          </section>

          <section className="matchingRoundFormPickerSection">
            <div className="matchingRoundFormPickerSectionHeader matchingRoundFormPickerLibraryHeader">
              <div className="matchingRoundFormPickerSectionCopy">
                <h5 className="matchingRoundFormPickerSectionTitle">
                  {t(
                    "opportunities.matchingRound.formPicker.libraryTitle",
                    {},
                    { default: "Class form library" },
                  )}
                </h5>
                <p className="matchingRoundFormPickerSectionHint">
                  {t(
                    "opportunities.matchingRound.formPicker.libraryHint",
                    {},
                    {
                      default:
                        "Shared forms for this class. Use Add to this round to attach one. Class teachers and mentors can manage these forms.",
                    },
                  )}
                </p>
              </div>
              <div className="matchingRoundFormPickerLibraryToolbar">
                <div className="matchingRoundFormPickerLibraryActions">
                  <Button
                    type="button"
                    variant="filled"
                    className="matchingRoundFormPickerCreateButton"
                    disabled={
                      !canManageOpportunities || libraryBusy || !myclass?.id
                    }
                    onClick={openCreateWizard}
                  >
                    {t(
                      "opportunities.matchingRound.formPicker.createButton",
                      {},
                      { default: "Create form" },
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {classLibraryForms.length === 0 ? (
              <p className="matchingRoundFormPickerLibraryEmpty">
                {classLibraryFormDefinitions.length > 0
                  ? t(
                      "opportunities.matchingRound.formPicker.libraryAllSelected",
                      {},
                      {
                        default:
                          "All class forms are already selected for this round.",
                      },
                    )
                  : t(
                      "opportunities.matchingRound.formPicker.libraryEmpty",
                      {},
                      {
                        default:
                          "No class forms yet. Create one or copy a public form below.",
                      },
                    )}
              </p>
            ) : (
              <ul className="matchingRoundFormPickerLibraryList">
                {classLibraryForms.map((form) =>
                  renderFormRow(form, {
                    menuItems: buildClassLibraryMenuItems(form),
                    showAddToRound: true,
                  }),
                )}
              </ul>
            )}
          </section>

          <section
            className={clsx(
              "matchingRoundFormPickerSection",
              "matchingRoundFormPickerSectionPublic",
              publicFormsExpanded && "isExpanded",
            )}
          >
            <div className="matchingRoundFormPickerSectionHeader matchingRoundFormPickerLibraryHeader">
              <div className="matchingRoundFormPickerSectionCopy">
                <h5 className="matchingRoundFormPickerSectionTitle">
                  {t(
                    "opportunities.matchingRound.formPicker.publicTitle",
                    {},
                    { default: "Public forms" },
                  )}
                </h5>
                <p className="matchingRoundFormPickerSectionHint">
                  {t(
                    "opportunities.matchingRound.formPicker.publicHint",
                    {},
                    {
                      default:
                        "MindHive templates you can attach as-is or copy into the class library to customize.",
                    },
                  )}
                </p>
              </div>
              <div className="matchingRoundFormPickerLibraryToolbar">
                <div className="matchingRoundFormPickerLibraryActions">
                  <Button
                    type="button"
                    variant="outline"
                    className="matchingRoundFormPickerPublicToggle"
                    disabled={libraryBusy}
                    onClick={() =>
                      setPublicFormsExpanded((prev) => !prev)
                    }
                    aria-expanded={publicFormsExpanded}
                  >
                    {publicFormsExpanded
                      ? t(
                          "opportunities.matchingRound.formPicker.hidePublicForms",
                          {},
                          { default: "Hide public forms" },
                        )
                      : t(
                          "opportunities.matchingRound.formPicker.showPublicForms",
                          {},
                          { default: "Show public forms" },
                        )}
                  </Button>
                </div>
              </div>
            </div>

            {publicFormsExpanded ? (
              publicForms.length === 0 ? (
                <p className="matchingRoundFormPickerLibraryEmpty">
                  {publicFormDefinitions.length > 0
                    ? t(
                        "opportunities.matchingRound.formPicker.publicAllSelected",
                        {},
                        {
                          default:
                            "All listed public forms are already selected for this round.",
                        },
                      )
                    : t(
                        "opportunities.matchingRound.formPicker.publicEmpty",
                        {},
                        {
                          default: "No public forms are available yet.",
                        },
                      )}
                </p>
              ) : (
                <ul className="matchingRoundFormPickerLibraryList">
                  {publicForms.map((form) =>
                    renderFormRow(form, {
                      menuItems: buildPublicMenuItems(form),
                      showAddToRound: true,
                    }),
                  )}
                </ul>
              )
            ) : null}
          </section>

          <p className="matchingRoundFormPickerNote matchingRoundFormPickerReuseNote">
            {t("opportunities.matchingRound.formPicker.reuseNote", {}, {
              default:
                "If an opportunity already has answers for a selected form, those questions will not be asked again.",
            })}
          </p>
        </div>
        ) : (
          <div
            className={clsx("matchingRoundFormSummary", {
              isNeutral: selectedFormDefinitionIds.length === 0,
              isInformation:
                selectedFormDefinitionIds.length > 0 && !sponsorFormsVisible,
              isSuccess:
                selectedFormDefinitionIds.length > 0 && sponsorFormsVisible,
            })}
          >
            <div className="matchingRoundFormSummaryCopy">
              <h4 className="matchingRoundFormSummaryTitle">
                {t(
                  "opportunities.matchingRound.formPicker.summaryTitle",
                  {},
                  { default: "Sponsor questionnaires" },
                )}
              </h4>
              <p className="matchingRoundFormSummaryStatus">
                {[
                  selectedFormDefinitionIds.length === 1
                    ? t(
                        "opportunities.matchingRound.formPicker.summaryCountOne",
                        {},
                        { default: "1 form" },
                      )
                    : t(
                        "opportunities.matchingRound.formPicker.summaryCount",
                        { count: selectedFormDefinitionIds.length },
                        { default: "{{count}} forms" },
                      ),
                  sponsorFormsVisible
                    ? t(
                        "opportunities.matchingRound.formPicker.visibilityVisible",
                        {},
                        { default: "Visible to sponsors" },
                      )
                    : t(
                        "opportunities.matchingRound.formPicker.visibilityHidden",
                        {},
                        { default: "Hidden from sponsors" },
                      ),
                ].join(" · ")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="matchingRoundFormSummaryManage"
              style={{ color: "inherit", borderColor: "currentColor" }}
              onClick={() => setFormsManagerOpen(true)}
            >
              {t(
                "opportunities.matchingRound.followUpCompletion.manageForms",
                {},
                { default: "Manage questionnaires" },
              )}
            </Button>
          </div>
        )}

        <MatchingRoundFollowUpCompletionGrid
          opportunities={selectedNetworkOpportunities}
          forms={selectedFormDefinitionIds.map((id) => ({
            id,
            title: formLabelsById[id] || id,
          }))}
          sponsorFormsVisible={sponsorFormsVisible}
          onPreview={onPreviewOpportunity}
          onManageForms={() => setFormsManagerOpen(true)}
        />

        <MatchingRoundFormPreviewModal
          open={formPreviewOpen}
          onClose={() => {
            setFormPreviewOpen(false);
            setFormPreviewIds([]);
          }}
          formDefinitionIds={formPreviewIds}
          formLabelsById={formLabelsById}
        />
        <TeacherFormWizard
          open={formWizardOpen}
          onClose={() => {
            setFormWizardOpen(false);
            setFormWizardDefinitionId(null);
          }}
          classId={myclass?.id}
          definitionId={formWizardDefinitionId}
          onSaved={async (saved, { didPublish } = {}) => {
            if (!saved?.id) return;
            try {
              await refetchFormLists();
            } catch {
              // Selection still proceeds; lists may refresh on next load.
            }
            setLibrarySelectedId(saved.id);
            // Only attach when the teacher explicitly published from the
            // wizard. Save as draft must never add (or keep adding) a form
            // based solely on returned status.
            if (didPublish) {
              const nextIds = selectedFormDefinitionIds.includes(saved.id)
                ? selectedFormDefinitionIds
                : [...selectedFormDefinitionIds, saved.id];
              await persistFormDefinitionSelection(nextIds);
              setFormWizardBanner(
                t(
                  "opportunities.matchingRound.formWizard.publishedAndAdded",
                  {},
                  { default: "Published and added to this round." },
                ),
              );
              return;
            }
            // If a form already in this round was demoted to draft, detach it.
            if (
              saved.status === "draft" &&
              selectedFormDefinitionIds.includes(saved.id)
            ) {
              await persistFormDefinitionSelection(
                selectedFormDefinitionIds.filter((id) => id !== saved.id),
              );
            }
            setFormWizardBanner(
              t(
                "opportunities.matchingRound.formWizard.savedAsDraft",
                {},
                {
                  default:
                    "Saved as draft (not visible to sponsors yet).",
                },
              ),
            );
          }}
        />
        <Modal
          open={Boolean(publishAddForm)}
          onClose={closePublishAddModal}
          title={t(
            "opportunities.matchingRound.formPicker.publishAddModal.title",
            {},
            { default: "Publish this form?" },
          )}
          actions={
            <>
              <Button
                type="button"
                variant="text"
                onClick={closePublishAddModal}
                disabled={publishingAdd}
              >
                {t(
                  "opportunities.matchingRound.formPicker.publishAddModal.cancel",
                  {},
                  { default: "Cancel" },
                )}
              </Button>
              <Button
                type="button"
                variant="filled"
                onClick={confirmPublishAndAdd}
                disabled={publishingAdd || !publishAddForm?.id}
              >
                {publishingAdd
                  ? t("opportunities.matchingRound.saving", {}, {
                      default: "Saving…",
                    })
                  : t(
                      "opportunities.matchingRound.formPicker.publishAddModal.confirm",
                      {},
                      { default: "Publish and add" },
                    )}
              </Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            {t(
              "opportunities.matchingRound.formPicker.publishAddModal.body",
              { title: publishAddForm?.title || "" },
              {
                default:
                  "“{{title}}” is still a draft. Publish it and add it to this matching round?",
              },
            )}
          </p>
          {publishAddError ? (
            <p
              role="alert"
              style={{
                margin: "12px 0 0",
                color: "var(--MH-Theme-Error-Dark, #b3261e)",
              }}
            >
              {publishAddError}
            </p>
          ) : null}
        </Modal>
      </div>
    );
  };

  const renderSelectedPanel = () => {
    const formCount = selectedFormDefinitionIds.length;
    const openFollowUpForms = () => {
      setFormsManagerOpen(true);
      setActivePanel(PANELS.forms);
    };

    let formsMessageVariant = "neutral";
    let formsMessage;
    if (formCount === 0) {
      formsMessageVariant = "neutral";
      formsMessage = t(
        "opportunities.matchingRound.formPicker.selectedTabNone",
        {},
        {
          default:
            "Add sponsor questionnaires in Follow-up when you’re ready.",
        },
      );
    } else if (!sponsorFormsVisible) {
      formsMessageVariant = "information";
      formsMessage =
        formCount === 1
          ? t(
              "opportunities.matchingRound.formPicker.selectedTabHiddenOne",
              {},
              {
                default:
                  "1 questionnaire selected — still hidden from sponsors. Open Follow-up to show it.",
              },
            )
          : t(
              "opportunities.matchingRound.formPicker.selectedTabHidden",
              { count: formCount },
              {
                default:
                  "{{count}} questionnaires selected — still hidden from sponsors. Open Follow-up to show them.",
              },
            );
    } else {
      formsMessageVariant = "success";
      formsMessage =
        formCount === 1
          ? t(
              "opportunities.matchingRound.formPicker.selectedTabVisibleOne",
              {},
              { default: "1 questionnaire is visible to sponsors." },
            )
          : t(
              "opportunities.matchingRound.formPicker.selectedTabVisible",
              { count: formCount },
              {
                default: "{{count}} questionnaires are visible to sponsors.",
              },
            );
    }

    return (
      <div className="classTabMatchingRoundPanel">
        {formWizardBanner ? (
          <MessageCard
            variant="success"
            message={formWizardBanner}
            onClose={() => setFormWizardBanner(null)}
            closeAriaLabel={t(
              "opportunities.matchingRound.formWizard.bannerDismiss",
              {},
              { default: "Dismiss" },
            )}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <MessageCard
          className="matchingRoundSelectedFormsMessage"
          variant={formsMessageVariant}
          message={formsMessage}
          onClick={openFollowUpForms}
          ariaLabel={formsMessage}
        />
        <MatchingRoundOpportunitiesGrid
          opportunities={selectedNetworkOpportunities}
          selectedIds={selectedOpportunities}
          selectionMode="readOnly"
          onPreview={onPreviewOpportunity}
          onRemove={canManageOpportunities ? handleRemoveFromRound : undefined}
          togglingOpportunityId={togglingOpportunityId}
          roundId={roundId}
          emptyMessage={t("opportunities.matchingRound.selectedOpportunitiesEmpty", {}, {
            default:
              "No opportunities selected yet. Use Review opportunities to add some.",
          })}
        />
      </div>
    );
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

  return (
    <CardShell
      title={cardHeaderTitle}
      titleMuted={isNew}
      expanded
      onToggleExpand={onToggleExpand}
      headerActions={headerActions}
      t={t}
    >
      {loading ? (
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
      ) : (
        <div className="classTabExpandableBody">
          <div className="classTabMatchingRoundNavRow">
            <Navbar style={{ paddingLeft: 0, paddingRight: 0 }}>
              {panelOptions.map((panel) => (
                <NavbarItem
                  key={panel.id}
                  selected={activePanel === panel.id}
                  disabled={panel.disabled}
                  onClick={
                    panel.disabled
                      ? undefined
                      : () => setActivePanel(panel.id)
                  }
                  style={{
                    backgroundColor:
                      activePanel === panel.id ? "#DEF8FB" : "transparent",
                    opacity: panel.disabled ? 0.45 : undefined,
                    cursor: panel.disabled ? "not-allowed" : undefined,
                  }}
                  aria-disabled={panel.disabled || undefined}
                >
                  {panel.label}
                </NavbarItem>
              ))}
            </Navbar>
            <div className="classTabMatchingRoundNavActions">
              <IconButton
                className="classTabMatchingRoundExportButton"
                variant="text"
                style={{ background: "#f3f3f3" }}
                elevated={false}
                ariaLabel={exportLabel}
                title={exportLabel}
                disabled={networkOpportunities.length === 0}
                onClick={() => setExportModalOpen(true)}
                icon={
                  <img
                    src="/assets/icons/download.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                }
              />
              <IconButton
                className="classTabMatchingRoundSettingsButton"
                style={{ background: "#f3f3f3" }}
                variant="text"
                elevated={false}
                ariaLabel={settingsLabel}
                title={settingsLabel}
                onClick={() => setSettingsModalOpen(true)}
                icon={
                  <img
                    src="/assets/icons/settings.svg"
                    alt=""
                    aria-hidden
                    width={24}
                    height={24}
                  />
                }
              />
            </div>
          </div>

          <OpportunityExportModal
            open={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            listOpportunities={networkOpportunities}
            selectedOpportunityIds={selectedOpportunities}
            roundId={roundId}
            roundTitle={
              inputs.title ||
              round?.title ||
              roundSummary?.title ||
              t("opportunities.matchingRound.newRoundTitle", {}, {
                default: "New matching round",
              })
            }
            networkTitle={
              selectedNetwork?.title ||
              round?.classNetwork?.title ||
              roundSummary?.classNetwork?.title ||
              ""
            }
          />

          <Modal
            open={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            title={settingsLabel}
            maxWidth={560}
            actions={
              <Button
                variant="text"
                type="button"
                onClick={() => setSettingsModalOpen(false)}
              >
                {t("close", {}, { default: "Close" })}
              </Button>
            }
          >
            <SettingsModalContent>
              {renderSettingsPanel()}
            </SettingsModalContent>
          </Modal>

          <div className="classTabMatchingRoundForm">
            {activePanel === PANELS.review && renderReviewPanel()}
            {activePanel === PANELS.selected && renderSelectedPanel()}
            {activePanel === PANELS.forms && renderFormsPanel()}
            {activePanel === PANELS.questions && renderQuestionsPanel()}

            <div className="classTabMatchingRoundFooter">
              {isDirty ? (
                <p className="matchingRoundUnsavedHint">
                  {t("opportunities.matchingRound.unsavedChanges", {}, {
                    default: "Unsaved changes",
                  })}
                </p>
              ) : null}
              {isDirty || isNew ? (
                <Button
                  variant="filled"
                  onClick={handleSave}
                  disabled={saving || !formInitialized}
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
      )}
    </CardShell>
  );
}

/**
 * Accordion card for an existing matching round, or a draft create editor.
 * Form/query state is only mounted while expanded.
 */
export default function MatchingRoundCard({
  myclass,
  networks,
  roundSummary,
  isCreate = false,
  initialNetworkId = null,
  expanded,
  onToggleExpand,
  onRegisterDirtyGuard,
  onPreviewOpportunity,
  onMatchingRoundContextChange,
  onCreated,
}) {
  const { t } = useTranslation("classes");

  if (!expanded) {
    return (
      <MatchingRoundCollapsedCard
        roundSummary={roundSummary}
        networks={networks}
        onToggleExpand={onToggleExpand}
        t={t}
      />
    );
  }

  return (
    <MatchingRoundEditor
      myclass={myclass}
      networks={networks}
      roundSummary={roundSummary}
      isCreate={isCreate}
      initialNetworkId={initialNetworkId}
      onToggleExpand={onToggleExpand}
      onRegisterDirtyGuard={onRegisterDirtyGuard}
      onPreviewOpportunity={onPreviewOpportunity}
      onMatchingRoundContextChange={onMatchingRoundContextChange}
      onCreated={onCreated}
    />
  );
}
