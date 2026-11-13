import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";
import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";
import {
  MY_TASKS,
  MY_TASK_VERSION_USAGE,
  PUBLIC_TASKS,
} from "../../../../Queries/Task";
import { DELETE_TASK } from "../../../../Mutations/Task";
import { STUDY_TEMPLATES } from "../../../../Queries/Study";
import useHiddenTaskIds from "../../../../Tasks/Bank/useHiddenTaskIds";
import useHiddenStudyIds from "../../../../Tasks/Bank/useHiddenStudyIds";
import { excludeHiddenTasks } from "../../../../../lib/taskBankFilter";
import { getLocalizedField } from "../../../../../lib/i18nContent";

import Card from "./Blocks/Card";
import BlocksLoading from "./Blocks/Loading";
import StudyCard from "./Templates/StudyCard";
import StudyFlowPointerCard from "./StudyFlowPointerCard";

const SURVEY_BUILDER_SLUG = "survey-builder";

const I18N_FIELDS = [
  "title",
  "description",
  "descriptionForParticipants",
  "settings",
  "resources",
  "aggregateVariables",
  "addInfo",
  "parameters",
];

// Type chips, in display order. `taskType` matches Task.taskType; templates
// are studies and come from their own query.
const TYPE_FILTERS = [
  { value: "ALL" },
  { value: "TASK", labelKey: "selector.tasks.title", label: "Tasks" },
  { value: "SURVEY", labelKey: "selector.surveys.title", label: "Surveys" },
  { value: "BLOCK", labelKey: "selector.basicBlocks.title", label: "Blocks" },
  {
    value: "TEMPLATES",
    labelKey: "selector.templates.title",
    label: "Templates",
  },
];

const DESCRIPTIONS = {
  TASK: {
    key: "selector.tasks.description",
    default:
      "Want to <strong>measure a construct or variable</strong> by having participants <strong>complete an activity</strong>? Choose from this bank of validated tasks",
  },
  SURVEY: {
    key: "selector.surveys.description",
    default:
      "Want to <strong>measure participants' attitudes, experiences, or opinions</strong> through <strong>self-report</strong>? Choose from this bank of validated surveys",
  },
  BLOCK: {
    key: "selector.basicBlocks.description",
    default:
      "Want to include <strong>custom instructions</strong> to your participants or <strong>embed a link and/or video</strong> in your study's procedure? Select and edit a basic block",
  },
  TEMPLATES: {
    key: "selector.templates.description",
    default: "Use the flows from MindHive featured studies",
  },
};

// A private task copied from another one: the copy a study block got when it
// was added. These are "My versions", hidden from the default list.
const isOwnVersion = (task) => !task?.public && !!task?.copiedFrom?.id;

const textOf = (value) => (typeof value === "string" ? value : "");

const byTitle = (a, b) =>
  textOf(a?.title).localeCompare(textOf(b?.title), undefined, {
    sensitivity: "base",
  });

export default function ComponentSelector({
  engine,
  user,
  addFunctions,
  onOpenStudyFlow,
  studyId,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const locale = router.locale || "en-us";
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [versionsOnly, setVersionsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeType, setActiveType] = useState("ALL");

  // Students only: what their classes hide from the bank.
  const hiddenTaskIds = useHiddenTaskIds();
  const hiddenStudyIds = useHiddenStudyIds();

  // One query for every type (plus the user's own unpublished blocks); the
  // chips and the search filter locally so each chip can show its count.
  const { data: publicData, loading: publicLoading } = useQuery(PUBLIC_TASKS, {
    variables: {
      where: excludeHiddenTasks({ public: { equals: true } }, hiddenTaskIds),
    },
  });
  const { data: ownedData, loading: ownedLoading } = useQuery(MY_TASKS, {
    variables: {
      where: {
        AND: [
          { public: { equals: false } },
          {
            OR: [
              { author: { id: { equals: user?.id } } },
              { collaborators: { some: { id: { equals: user?.id } } } },
            ],
          },
        ],
      },
    },
    skip: !user?.id,
  });
  const { data: templatesData, loading: templatesLoading } = useQuery(
    STUDY_TEMPLATES,
    { variables: { id: user?.id } }
  );

  const allTasks = useMemo(() => {
    const publicTasks = publicData?.tasks || [];
    const seen = new Set(publicTasks.map((task) => task?.id));
    const ownedTasks = (ownedData?.tasks || []).filter(
      (task) => task?.id && !seen.has(task.id)
    );
    return [...publicTasks, ...ownedTasks].map((task) => {
      const localized = { ...task };
      I18N_FIELDS.forEach((field) => {
        localized[field] = getLocalizedField(task, field, locale);
      });
      return localized;
    });
  }, [publicData, ownedData, locale]);

  const term = search.trim().toLowerCase();
  const matches = (...fields) =>
    !term || fields.map(textOf).join(" ").toLowerCase().includes(term);

  const surveyBuilder = allTasks.find(
    (task) => task?.slug === SURVEY_BUILDER_SLUG
  );

  const favoriteIds = new Set(
    (user?.favoriteTasks || []).map((task) => task?.id)
  );
  const tasks = allTasks.filter(
    (task) =>
      task?.slug !== SURVEY_BUILDER_SLUG &&
      isOwnVersion(task) === versionsOnly &&
      (!favoritesOnly || favoriteIds.has(task?.id)) &&
      matches(task?.title, task?.description, task?.copiedFrom?.title)
  );

  // Where each version is used. This study counts what is on the canvas now
  // (saved or not); other studies count their saved diagram.
  const versionIds = versionsOnly ? tasks.map((task) => task.id) : [];
  const { data: usageData } = useQuery(MY_TASK_VERSION_USAGE, {
    variables: { userId: user?.id, taskIds: versionIds },
    skip: !versionsOnly || !user?.id || !versionIds.length,
    fetchPolicy: "cache-and-network",
  });
  const canvasTaskIds = new Set(
    versionsOnly
      ? (engine?.getModel?.()?.getNodes?.() || [])
          .map((node) => node?.options?.componentID)
          .filter(Boolean)
      : []
  );
  const thisStudyLabel = t(
    "selector.versions.thisStudy",
    {},
    { default: "this study" }
  );
  const versionInfo = (task) => {
    const usedIn = (usageData?.studies || [])
      .filter(
        (study) =>
          study?.id !== studyId &&
          typeof study?.diagram === "string" &&
          study.diagram.includes(task.id)
      )
      .map((study) => study.title);
    if (canvasTaskIds.has(task.id)) usedIn.unshift(thisStudyLabel);
    const hasData =
      (usageData?.tasks || []).find((row) => row?.id === task.id)
        ?.datasetsCount > 0;
    return {
      originalTitle: task?.copiedFrom?.title,
      usedIn,
      hasData,
      // Only claim "unused" once usage has loaded.
      unused: !!usageData && !usedIn.length && !hasData,
    };
  };

  const [deleteTask] = useMutation(DELETE_TASK, {
    refetchQueries: ["MY_TASKS", "MY_TASK_VERSION_USAGE"],
  });
  const deleteVersion = async (task) => {
    const confirmed = window.confirm(
      t(
        "selector.versions.deleteConfirm",
        { title: task?.title },
        {
          default: `Delete this unused version of "${task?.title}"? This cannot be undone.`,
        }
      )
    );
    if (!confirmed) return;
    try {
      await deleteTask({ variables: { id: task.id } });
    } catch (error) {
      alert(
        t(
          "selector.versions.deleteFailed",
          {},
          { default: "This version could not be deleted." }
        )
      );
    }
  };

  // Templates can't be favorited and aren't versions, so either toggle
  // empties them.
  const templates =
    favoritesOnly || versionsOnly
      ? []
      : (templatesData?.studies || [])
          .filter(
            (study) =>
              !!study?.diagram &&
              study?.public &&
              !hiddenStudyIds.includes(study?.id) &&
              matches(study?.title, study?.slug)
          )
          .sort(byTitle);

  // The between-subjects design lives in the Study Flow tab; a pointer card
  // stands in for it among the blocks and answers the same search.
  const designTitle = t(
    "selector.studyDesign.betweenSubjects",
    {},
    { default: "Between-subjects design" }
  );
  const showDesignPointer =
    !favoritesOnly && !versionsOnly && matches(designTitle);
  const designPointer = showDesignPointer
    ? [
        {
          id: "__design-pointer",
          title: designTitle,
          taskType: "BLOCK",
          isDesignPointer: true,
        },
      ]
    : [];

  const listItems = [...tasks, ...designPointer];
  const counts = {
    ALL: listItems.length + templates.length,
    TEMPLATES: templates.length,
  };
  ["TASK", "SURVEY", "BLOCK"].forEach((type) => {
    counts[type] = listItems.filter((item) => item?.taskType === type).length;
  });

  const visibleItems =
    activeType === "ALL"
      ? listItems
      : listItems.filter((item) => item?.taskType === activeType);
  const sortedItems = [...visibleItems].sort(byTitle);
  const showTemplates = activeType === "ALL" || activeType === "TEMPLATES";
  const showSurveyBuilder =
    !!surveyBuilder &&
    !versionsOnly &&
    (activeType === "ALL" || activeType === "SURVEY") &&
    (!term ||
      "survey builder".includes(term) ||
      SURVEY_BUILDER_SLUG.includes(term));

  const loading =
    (publicLoading && !publicData) ||
    (ownedLoading && !ownedData) ||
    (showTemplates && templatesLoading && !templatesData);

  const isEmpty =
    !sortedItems.length &&
    !(showTemplates && templates.length) &&
    !showSurveyBuilder;

  const description = DESCRIPTIONS[activeType];

  return (
    <div className="editPane">
      {/* Search shares the row with the toggles; while it is in use it takes
          the whole row and the toggles move under it. */}
      <div
        className={`addBlockFilters${
          searchFocused || search ? " isSearchExpanded" : ""
        }`}
      >
        <div className="addBlockSearch" id="search">
          <input
            type="text"
            name="keyword"
            value={search}
            onChange={(e) => setSearch(e?.target?.value || "")}
            placeholder={t(
              "selector.searchPlaceholder",
              {},
              {
                default: "Search for blocks",
              }
            )}
            onFocus={() => {
              setSearchFocused(true);
              engine.getModel().setLocked(true);
            }}
            onBlur={() => {
              setSearchFocused(false);
              engine.getModel().setLocked(false);
            }}
          />
        </div>
        {/* Keeps focus in the search box while a toggle is pressed, so the
            row doesn't collapse under the pointer mid-click. */}
        <div
          className="addBlockFavorite"
          role="presentation"
          onMouseDown={(e) => {
            if (searchFocused) e.preventDefault();
          }}
        >
          <ToggleSwitch
            id="favoritesOnly"
            checked={favoritesOnly}
            onChange={setFavoritesOnly}
            label={
              favoritesOnly
                ? t("selector.filter.favorite", {}, { default: "Favorite" })
                : t("selector.filter.all", {}, { default: "All" })
            }
          />
          <ToggleSwitch
            id="versionsOnly"
            checked={versionsOnly}
            onChange={setVersionsOnly}
            label={t(
              "selector.versions.toggle",
              {},
              { default: "My versions" }
            )}
          />
        </div>
      </div>

      <div className="blocksMenu" id="blocksMenu">
        <div
          className="addBlockChips"
          role="group"
          aria-label={t(
            "selector.sectionTabs",
            {},
            {
              default: "Block types",
            }
          )}
        >
          {TYPE_FILTERS.map((filter) => {
            const isSelected = activeType === filter.value;
            const label =
              filter.value === "ALL"
                ? t("selector.filter.all", {}, { default: "All" })
                : t(filter.labelKey, {}, { default: filter.label });
            return (
              <Chip
                key={filter.value}
                label={`${label} (${counts[filter.value] ?? 0})`}
                selected={isSelected}
                onClick={() => setActiveType(filter.value)}
                // The active non-default chip clears back to "All", as on the
                // discover page.
                onClose={
                  isSelected && filter.value !== "ALL"
                    ? () => setActiveType("ALL")
                    : undefined
                }
              />
            );
          })}
        </div>

        <div className="blocksMenuContent">
          {description && (
            <p className="blocksMenuDescription">
              {ReactHtmlParser(
                t(description.key, {}, { default: description.default })
              )}
            </p>
          )}

          {loading ? (
            <BlocksLoading />
          ) : (
            <>
              {activeType !== "TEMPLATES" && (
                <div>
                  {sortedItems.map((item) =>
                    item.isDesignPointer ? (
                      <StudyFlowPointerCard
                        key={item.id}
                        title={item.title}
                        onOpenStudyFlow={onOpenStudyFlow}
                      />
                    ) : (
                      <Card
                        user={user}
                        key={item.id}
                        component={item}
                        addFunctions={addFunctions}
                        search={search}
                        componentType={item.taskType}
                        version={versionsOnly ? versionInfo(item) : undefined}
                        onDelete={
                          versionsOnly ? () => deleteVersion(item) : undefined
                        }
                      />
                    )
                  )}
                </div>
              )}

              {showTemplates && templates.length > 0 && (
                <div>
                  {templates.map((study) => (
                    <StudyCard
                      key={study.id}
                      study={study}
                      addFunctions={addFunctions}
                    />
                  ))}
                </div>
              )}

              {isEmpty && (
                <p className="blocksMenuDescription">
                  {versionsOnly && !term
                    ? t(
                        "selector.versions.empty",
                        {},
                        {
                          default:
                            "No versions yet. You get your own version of a block each time you add it to a study.",
                        }
                      )
                    : t(
                        "selector.noResults",
                        {},
                        { default: "No blocks match your search" }
                      )}
                </p>
              )}

              {showSurveyBuilder && (
                <div className="blocksMenuSurveyBuilder">
                  <p className="blocksMenuSurveyBuilderHint">
                    {t(
                      "selector.surveys.buildOwnLine1",
                      {},
                      {
                        default:
                          "Cannot find a tool to measure one of your study constructs?",
                      }
                    )}
                  </p>
                  <p className="blocksMenuSurveyBuilderHintStrong">
                    {t(
                      "selector.surveys.buildOwnLine2",
                      {},
                      {
                        default:
                          "Build your own with the Survey builder and teacher's help",
                      }
                    )}
                  </p>
                  <Card
                    user={user}
                    component={surveyBuilder}
                    addFunctions={addFunctions}
                    search=""
                    componentType="SURVEY"
                    isSurveyBuilder
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
