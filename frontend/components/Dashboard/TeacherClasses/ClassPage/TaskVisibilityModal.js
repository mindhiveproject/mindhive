import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { PUBLIC_TASKS_FOR_CLASS_VISIBILITY } from "../../../Queries/Task";
import { UPDATE_CLASS_HIDDEN_TASKS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
import Modal from "../../../DesignSystem/Modal";
import Button from "../../../DesignSystem/Button";
import ToggleSwitch from "../../../DesignSystem/ToggleSwitch";
import Input from "../../../DesignSystem/Input";
import MessageCard from "../../../DesignSystem/MessageCard";

const TYPE_GROUPS = [
  { taskType: "TASK", key: "taskVisibility.groupTasks", default: "Tasks" },
  {
    taskType: "SURVEY",
    key: "taskVisibility.groupSurveys",
    default: "Surveys",
  },
  { taskType: "BLOCK", key: "taskVisibility.groupBlocks", default: "Blocks" },
];

const StyledTaskVisibility = styled.div`
  display: grid;
  gap: 16px;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .search {
    flex: 1 1 260px;
  }

  .count {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    font: var(--MH-Type-Body-Base);
  }

  .group h4 {
    margin: 8px 0;
    font: var(--MH-Type-Title-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    cursor: pointer;
    font: var(--MH-Type-Body-Base);
    &:hover {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    }
    &.isHidden .title {
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    /* Same width for "Visible" and "Hidden" so the switches line up. */
    .DesignSystem-ToggleSwitch__label {
      min-width: 64px;
    }
  }
`;

// Title in the viewer's language, falling back to the original.
function taskTitle(task, locale) {
  return task?.i18nContent?.[locale]?.title || task?.title || "";
}

// Lists every public task and survey with a Visible/Hidden switch for the
// class's students. Saving stores the hidden ones as Class.hiddenTasks, so
// anything published later starts out visible.
export default function TaskVisibilityModal({ open, onClose, myclass }) {
  const { t } = useTranslation("classes");
  const { locale } = useRouter();
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState(() => new Set());

  const { data, loading, error } = useQuery(PUBLIC_TASKS_FOR_CLASS_VISIBILITY, {
    skip: !open,
  });
  const tasks = useMemo(
    () =>
      [...(data?.tasks || [])].sort((a, b) =>
        taskTitle(a, locale).localeCompare(taskTitle(b, locale), locale)
      ),
    [data, locale]
  );

  const savedHiddenIds = useMemo(
    () => (myclass?.hiddenTasks || []).map((task) => task?.id),
    [myclass?.hiddenTasks]
  );

  // Start each opening from what is saved.
  useEffect(() => {
    if (open) {
      setHidden(new Set(savedHiddenIds));
      setSearch("");
    }
  }, [open, savedHiddenIds]);

  const [updateHiddenTasks, { loading: saving, error: saveError }] =
    useMutation(UPDATE_CLASS_HIDDEN_TASKS, {
      refetchQueries: [
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    });

  const term = search.trim().toLowerCase();
  const filtered = tasks.filter(
    (task) =>
      !term ||
      taskTitle(task, locale).toLowerCase().includes(term) ||
      task?.title?.toLowerCase().includes(term)
  );
  const visibleCount = tasks.filter((task) => !hidden.has(task.id)).length;

  const publicIds = useMemo(
    () => new Set(tasks.map((task) => task.id)),
    [tasks]
  );
  const isDirty = tasks.some(
    (task) => hidden.has(task.id) !== savedHiddenIds.includes(task.id)
  );

  const toggle = (id) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Bulk actions apply to what the search currently shows.
  const setFiltered = (makeHidden) =>
    setHidden((prev) => {
      const next = new Set(prev);
      filtered.forEach((task) =>
        makeHidden ? next.add(task.id) : next.delete(task.id)
      );
      return next;
    });

  const save = async () => {
    // Keep hidden tasks that are not public right now, so they stay hidden if
    // they are published again.
    const ids = [
      ...savedHiddenIds.filter((id) => !publicIds.has(id)),
      ...tasks.filter((task) => hidden.has(task.id)).map((task) => task.id),
    ];
    await updateHiddenTasks({
      variables: { id: myclass?.id, hiddenTasks: ids.map((id) => ({ id })) },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      size="large"
      title={t(
        "taskVisibility.modalTitle",
        {},
        {
          default: "Tasks & surveys your students can see",
        }
      )}
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={saving}>
            {t("taskVisibility.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            onClick={save}
            disabled={saving || loading || !isDirty}
          >
            {saving
              ? t("taskVisibility.saving", {}, { default: "Saving…" })
              : t("taskVisibility.save", {}, { default: "Save" })}
          </Button>
        </>
      }
    >
      <StyledTaskVisibility>
        <p className="count">
          {t(
            "taskVisibility.modalDescription",
            {},
            {
              default:
                "Switch off anything you don't want your students to see on the discover page, in the descriptions PDF or in the study builder. Tasks and surveys published later are visible until you hide them.",
            }
          )}
        </p>

        <div className="toolbar">
          <div className="search">
            <Input
              type="search"
              value={search}
              onChange={setSearch}
              placeholder={t(
                "taskVisibility.searchPlaceholder",
                {},
                {
                  default: "Search tasks and surveys",
                }
              )}
              aria-label={t(
                "taskVisibility.searchPlaceholder",
                {},
                {
                  default: "Search tasks and surveys",
                }
              )}
            />
          </div>
          <Button
            variant="text"
            onClick={() => setFiltered(false)}
            disabled={!filtered.length}
          >
            {t("taskVisibility.showAll", {}, { default: "Show all" })}
          </Button>
          <Button
            variant="text"
            onClick={() => setFiltered(true)}
            disabled={!filtered.length}
          >
            {t("taskVisibility.hideAll", {}, { default: "Hide all" })}
          </Button>
          <span className="count" aria-live="polite">
            {t(
              "taskVisibility.visibleCount",
              { visible: visibleCount, total: tasks.length },
              { default: `${visibleCount} of ${tasks.length} visible` }
            )}
          </span>
        </div>

        {(error || saveError) && (
          <MessageCard
            variant="warning"
            message={t(
              "taskVisibility.error",
              {},
              {
                default: "Something went wrong. Please try again.",
              }
            )}
          />
        )}

        {loading && (
          <p className="count">
            {t("taskVisibility.loading", {}, { default: "Loading…" })}
          </p>
        )}

        {!loading && !filtered.length && (
          <MessageCard
            variant="neutral"
            message={t(
              "taskVisibility.noMatches",
              {},
              {
                default: "No tasks or surveys match your search.",
              }
            )}
          />
        )}

        {TYPE_GROUPS.map((group) => {
          const items = filtered.filter(
            (task) => task?.taskType === group.taskType
          );
          if (!items.length) return null;
          return (
            <section className="group" key={group.taskType}>
              <h4>{t(group.key, {}, { default: group.default })}</h4>
              {items.map((task) => {
                const isVisible = !hidden.has(task.id);
                const title = taskTitle(task, locale);
                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                  <div
                    key={task.id}
                    className={`row${isVisible ? "" : " isHidden"}`}
                    // The whole row toggles; the switch (and its label)
                    // handles its own clicks and keyboard.
                    onClick={(e) => {
                      if (!e.target.closest(".DesignSystem-ToggleSwitchRow"))
                        toggle(task.id);
                    }}
                  >
                    <span className="title">{title}</span>
                    <ToggleSwitch
                      checked={isVisible}
                      onChange={() => toggle(task.id)}
                      aria-label={title}
                      label={
                        isVisible
                          ? t(
                              "taskVisibility.visible",
                              {},
                              {
                                default: "Visible",
                              }
                            )
                          : t(
                              "taskVisibility.hidden",
                              {},
                              {
                                default: "Hidden",
                              }
                            )
                      }
                    />
                  </div>
                );
              })}
            </section>
          );
        })}
      </StyledTaskVisibility>
    </Modal>
  );
}
