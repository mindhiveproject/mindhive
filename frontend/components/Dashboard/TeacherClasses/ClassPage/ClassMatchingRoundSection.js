import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";
import Button from "../../../DesignSystem/Button";
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
  preferences_open: "preferencesOpen",
  preferences_closed: "preferencesClosed",
  matching: "matching",
  published: "published",
  archived: "archived",
};

const ALGO_I18N_KEYS = {
  stable_matching: "stableMatching",
  score_based: "scoreBased",
  teacher_curated: "teacherCurated",
};

export default function ClassMatchingRoundSection({
  myclass,
  selectedNetworkId,
  selectedNetwork,
  onPreviewOpportunity,
}) {
  const { t } = useTranslation("classes");
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [explicitNewRound, setExplicitNewRound] = useState(false);
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const { data: roundData, loading: loadingRound } = useQuery(
    GET_CONNECT_ROUND,
    {
      variables: { id: activeRoundId },
      skip: !activeRoundId,
      fetchPolicy: "cache-and-network",
    },
  );

  const round = roundData?.connectRound;

  const { inputs, handleChange, handleMultipleUpdate } = useForm(EMPTY_FORM);

  useEffect(() => {
    setExplicitNewRound(false);
    setExpanded(false);
  }, [selectedNetworkId]);

  useEffect(() => {
    if (!selectedNetworkId) {
      setActiveRoundId(null);
      setExplicitNewRound(false);
      setFormInitialized(false);
      return;
    }

    if (roundsForNetwork.length === 0) {
      setActiveRoundId(null);
      setExplicitNewRound(false);
      setFormInitialized(false);
      return;
    }

    if (explicitNewRound) return;

    const stillValid = roundsForNetwork.some((r) => r.id === activeRoundId);
    if (!activeRoundId || !stillValid) {
      setActiveRoundId(roundsForNetwork[0].id);
      setFormInitialized(false);
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
      handleMultipleUpdate(
        buildSuggestedRoundDefaults(myclass?.title, selectedNetwork?.title),
      );
      setSelectedOpportunities([]);
      setSelectedQuestions([]);
      setFormInitialized(true);
      return;
    }

    if (!round || round.id !== activeRoundId) return;

    handleMultipleUpdate({
      title: round.title || "",
      description: round.description || "",
      status: round.status || "preferences_open",
      openAt: toDateInputValue(round.openAt),
      closeAt: toDateInputValue(round.closeAt),
      matchingAlgorithm: round.matchingAlgorithm || "stable_matching",
    });
    setSelectedOpportunities((round.opportunities || []).map((o) => o.id));
    setSelectedQuestions((round.questions || []).map((q) => q.id));
    setFormInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, round?.id, activeRoundId, selectedNetworkId, myclass?.title, selectedNetwork?.title]);

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

  const statusOptions = useMemo(
    () =>
      Object.entries(ROUND_STATUS_KEYS).map(([value, key]) => ({
        value,
        label: t(`opportunities.matchingRound.status.${key}`, {}, {
          default: value,
        }),
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

  const handleOpportunitySelectionChange = (ids) => {
    setSelectedOpportunities(ids);
  };

  const toggleQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const roundStatusLabel = (status) => {
    const key = ROUND_STATUS_KEYS[status];
    if (!key) return status;
    return t(`opportunities.matchingRound.status.${key}`, {}, { default: status });
  };

  const algoHint = (algo) => {
    const key = ALGO_I18N_KEYS[algo];
    if (!key) return "";
    return t(
      `opportunities.matchingRound.algorithm.${key}Hint`,
      {},
      { default: "" },
    );
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

    if (isNew) {
      const result = await createConnectRound({
        variables: {
          input: {
            title: inputs.title,
            description: inputs.description || "",
            classNetwork: { connect: { id: selectedNetworkId } },
            status: inputs.status || "preferences_open",
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
        setExplicitNewRound(false);
        setActiveRoundId(newId);
        setFormInitialized(false);
      }
    } else {
      await updateConnectRound({
        variables: {
          id: activeRoundId,
          input: {
            title: inputs.title,
            description: inputs.description || "",
            classNetwork: { connect: { id: selectedNetworkId } },
            status: inputs.status || "preferences_open",
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
    }
  };

  const handleStartNewRound = () => {
    setExplicitNewRound(true);
    setActiveRoundId(null);
    setFormInitialized(false);
  };

  const handleOpenCreate = () => {
    if (roundsForNetwork.length === 0) {
      setExplicitNewRound(false);
      setActiveRoundId(null);
      setFormInitialized(false);
    } else {
      handleStartNewRound();
    }
    setExpanded(true);
  };

  const loading =
    loadingRounds || (!isNew && loadingRound && !round) || !formInitialized;

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
    setExpanded((prev) => !prev);
  };

  const statusChipTriggerStyle = {
    borderRadius: "100px",
    border: "none",
    padding: "2px 10px",
    height: "auto",
    minHeight: "24px",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: "18px",
    background: noRoundForNetwork ? "#f5f0e8" : "#f0f4f6",
    color: noRoundForNetwork ? "#8a6d3b" : "#5f6871",
  };

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
              onChange={(value) => handleMultipleUpdate({ status: value })}
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
          <div className="classTabMatchingRoundForm">
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "new") {
                      handleStartNewRound();
                    } else {
                      setExplicitNewRound(false);
                      setActiveRoundId(value);
                      setFormInitialized(false);
                    }
                  }}
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

          <label className="classTabFormField">
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
            <DropdownSelect
              value={inputs.matchingAlgorithm}
              options={algorithmOptions}
              onChange={(value) =>
                handleMultipleUpdate({ matchingAlgorithm: value })
              }
              ariaLabel={t("opportunities.matchingRound.fields.algorithm", {}, {
                default: "Matching algorithm",
              })}
            />
            {algoHint(inputs.matchingAlgorithm) ? (
              <p className="fieldAlgoHint">{algoHint(inputs.matchingAlgorithm)}</p>
            ) : null}
          </label>

          <div className="classTabFormSubsection">
            <h4>
              {t("opportunities.matchingRound.fields.opportunities", {}, {
                default: "Opportunities in this round",
              })}
            </h4>
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
                opportunities={networkOpportunities}
                selectedIds={selectedOpportunities}
                onSelectionChange={handleOpportunitySelectionChange}
                onPreview={onPreviewOpportunity}
              />
            )}
          </div>

          <div className="classTabFormSubsection">
            <h4>
              {t("opportunities.matchingRound.fields.questions", {}, {
                default: "Round questions",
              })}
            </h4>
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

          <div className="classTabFormActions">
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
          </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
