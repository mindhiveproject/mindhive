import { useId, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";

// Chips sit inside the bar, before the input, like a token field. The input
// rules out-rank StyledReview's `.board input` box styles.
const StyledTaskFilter = styled.div`
  position: relative;

  .TaskFilter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    background: #ffffff;
    cursor: text;
  }
  .TaskFilter-bar:focus-within {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  && .TaskFilter-bar input.TaskFilter-input {
    flex: 1 1 80px;
    min-width: 80px;
    border: none;
    padding: 6px 4px;
    outline: none;
    background: transparent;
  }

  .TaskFilter-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    max-height: 280px;
    overflow-y: auto;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background: #ffffff;
    border: 1px solid #a1a1a1;
    border-radius: 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  }
  .TaskFilter-option {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 12px;
    color: #5d5763;
    cursor: pointer;
  }
  .TaskFilter-option--active {
    background-color: #f5f5f5;
  }
  .TaskFilter-count {
    flex-shrink: 0;
    color: #6a6a6a;
  }
  .TaskFilter-empty {
    padding: 8px 12px;
    color: #6a6a6a;
  }
`;

/**
 * Search bar that adds the picked suggested tasks as removable chips.
 * `tasks` are `{ id, title, count }`; `taskTitles` labels selected ids that
 * are no longer in `tasks`.
 */
export default function TaskSuggestionFilter({
  tasks,
  taskTitles,
  value,
  onChange,
}) {
  const { t } = useTranslation("builder");
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (task) =>
        !value.includes(task.id) &&
        (!q || task.title.toLowerCase().includes(q))
    );
  }, [tasks, value, query]);

  const add = (taskId) => {
    onChange([...value, taskId]);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  };

  const remove = (taskId) => {
    onChange(value.filter((id) => id !== taskId));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (open && matches[activeIndex]) {
        event.preventDefault();
        add(matches[activeIndex].id);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && !query && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const emptyMessage = tasks.length
    ? t("review.taskFilterNoMatch", {}, {
        default: "No suggested task or survey matches",
      })
    : t("review.taskFilterNoSuggestions", {}, {
        default: "No tasks or surveys suggested at this milestone yet",
      });

  return (
    <StyledTaskFilter id="filterBySuggestedTasks">
      <div
        className="TaskFilter-bar"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((taskId) => {
          const title = taskTitles.get(taskId) || taskId;
          return (
            <Chip
              key={taskId}
              label={title}
              selected
              onClose={() => remove(taskId)}
            />
          );
        })}
        <input
          ref={inputRef}
          type="text"
          className="TaskFilter-input MH-Type-Body-Base"
          value={query}
          placeholder={
            value.length
              ? ""
              : t("review.taskFilterPlaceholder", {}, {
                  default: "Filter by suggested task or survey",
                })
          }
          aria-label={t("review.taskFilterLabel", {}, {
            default: "Filter by tasks and surveys suggested in reviews",
          })}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open ? (
        <ul id={listId} role="listbox" className="TaskFilter-list">
          {matches.length === 0 ? (
            <li className="TaskFilter-empty MH-Type-Body-Base">
              {emptyMessage}
            </li>
          ) : (
            matches.map((task, index) => (
              <li
                key={task.id}
                role="option"
                aria-selected={index === activeIndex}
                className={`TaskFilter-option MH-Type-Label-Base${
                  index === activeIndex ? " TaskFilter-option--active" : ""
                }`}
                // mousedown + preventDefault keeps focus in the input, so
                // the list doesn't close before the pick lands.
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(task.id);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span>{task.title}</span>
                <span className="TaskFilter-count">
                  {t(
                    "review.taskFilterProposalCount",
                    { count: task.count },
                    {
                      default:
                        task.count === 1
                          ? "1 proposal"
                          : `${task.count} proposals`,
                    }
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </StyledTaskFilter>
  );
}
