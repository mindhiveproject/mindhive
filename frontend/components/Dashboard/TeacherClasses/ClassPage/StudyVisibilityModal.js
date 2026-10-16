import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { FEATURED_STUDIES_FOR_CLASS_VISIBILITY } from "../../../Queries/Study";
import { UPDATE_CLASS_HIDDEN_STUDIES } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
import Modal from "../../../DesignSystem/Modal";
import Button from "../../../DesignSystem/Button";
import ToggleSwitch from "../../../DesignSystem/ToggleSwitch";
import Input from "../../../DesignSystem/Input";
import MessageCard from "../../../DesignSystem/MessageCard";

const StyledStudyVisibility = styled.div`
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
function studyTitle(task, locale) {
  return task?.title || "";
}

// Lists every featured study with a Visible/Hidden switch for the class's
// students. Saving stores the hidden ones as Class.hiddenStudies, so studies
// featured later start out visible.
export default function StudyVisibilityModal({ open, onClose, myclass }) {
  const { t } = useTranslation("classes");
  const { locale } = useRouter();
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState(() => new Set());

  const { data, loading, error } = useQuery(FEATURED_STUDIES_FOR_CLASS_VISIBILITY, {
    skip: !open,
  });
  const tasks = useMemo(
    () =>
      [...(data?.studies || [])].sort((a, b) =>
        studyTitle(a, locale).localeCompare(studyTitle(b, locale), locale)
      ),
    [data, locale]
  );

  const savedHiddenIds = useMemo(
    () => (myclass?.hiddenStudies || []).map((task) => task?.id),
    [myclass?.hiddenStudies]
  );

  // Start each opening from what is saved.
  useEffect(() => {
    if (open) {
      setHidden(new Set(savedHiddenIds));
      setSearch("");
    }
  }, [open, savedHiddenIds]);

  const [updateHiddenStudies, { loading: saving, error: saveError }] =
    useMutation(UPDATE_CLASS_HIDDEN_STUDIES, {
      refetchQueries: [
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    });

  const term = search.trim().toLowerCase();
  const filtered = tasks.filter(
    (task) =>
      !term ||
      studyTitle(task, locale).toLowerCase().includes(term) ||
      task?.title?.toLowerCase().includes(term)
  );
  const visibleCount = tasks.filter((task) => !hidden.has(task.id)).length;

  const featuredIds = useMemo(
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
    // Keep hidden studies that are not featured right now, so they stay
    // hidden if they are featured again.
    const ids = [
      ...savedHiddenIds.filter((id) => !featuredIds.has(id)),
      ...tasks.filter((task) => hidden.has(task.id)).map((task) => task.id),
    ];
    await updateHiddenStudies({
      variables: { id: myclass?.id, hiddenStudies: ids.map((id) => ({ id })) },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      size="large"
      title={t(
        "studyVisibility.modalTitle",
        {},
        {
          default: "Featured studies your students can see",
        }
      )}
      actions={
        <>
          <Button variant="text" onClick={onClose} disabled={saving}>
            {t("studyVisibility.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            onClick={save}
            disabled={saving || loading || !isDirty}
          >
            {saving
              ? t("studyVisibility.saving", {}, { default: "Saving…" })
              : t("studyVisibility.save", {}, { default: "Save" })}
          </Button>
        </>
      }
    >
      <StyledStudyVisibility>
        <p className="count">
          {t(
            "studyVisibility.modalDescription",
            {},
            {
              default:
                "Switch off any featured study you don't want your students to see on the discover page or as a template in the study builder. Studies featured later are visible until you hide them.",
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
                "studyVisibility.searchPlaceholder",
                {},
                {
                  default: "Search featured studies",
                }
              )}
              aria-label={t(
                "studyVisibility.searchPlaceholder",
                {},
                {
                  default: "Search featured studies",
                }
              )}
            />
          </div>
          <Button
            variant="text"
            onClick={() => setFiltered(false)}
            disabled={!filtered.length}
          >
            {t("studyVisibility.showAll", {}, { default: "Show all" })}
          </Button>
          <Button
            variant="text"
            onClick={() => setFiltered(true)}
            disabled={!filtered.length}
          >
            {t("studyVisibility.hideAll", {}, { default: "Hide all" })}
          </Button>
          <span className="count" aria-live="polite">
            {t(
              "studyVisibility.visibleCount",
              { visible: visibleCount, total: tasks.length },
              { default: `${visibleCount} of ${tasks.length} visible` }
            )}
          </span>
        </div>

        {(error || saveError) && (
          <MessageCard
            variant="warning"
            message={t(
              "studyVisibility.error",
              {},
              {
                default: "Something went wrong. Please try again.",
              }
            )}
          />
        )}

        {loading && (
          <p className="count">
            {t("studyVisibility.loading", {}, { default: "Loading…" })}
          </p>
        )}

        {!loading && !filtered.length && (
          <MessageCard
            variant="neutral"
            message={t(
              "studyVisibility.noMatches",
              {},
              {
                default: "No featured studies match your search.",
              }
            )}
          />
        )}

        <section className="group">
          {filtered.map((task) => {
            const isVisible = !hidden.has(task.id);
            const title = studyTitle(task, locale);
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
                          "studyVisibility.visible",
                          {},
                          {
                            default: "Visible",
                          }
                        )
                      : t(
                          "studyVisibility.hidden",
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
      </StyledStudyVisibility>
    </Modal>
  );
}
