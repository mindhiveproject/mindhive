import { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";

import { useQuery } from "@apollo/client";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

// `hiddenTaskIds` is the project class's block list (Class.hiddenTasks).
// Those tasks stay listed but disabled and sorted last, so mentors see what
// exists without suggesting blocks the students can't use. Suggestions saved
// before the teacher hid a task are kept and tagged instead.
export default function TaskSelector({
  name,
  handleItemChange,
  answer,
  hiddenTaskIds = [],
}) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(ALL_PUBLIC_TASKS);
  const tasks = data?.tasks || [];
  const router = useRouter();
  const { locale } = router;

  const hiddenIds = useMemo(() => new Set(hiddenTaskIds), [hiddenTaskIds]);
  const hiddenLabel = t(
    "reviewDetail.taskHiddenForClass",
    {},
    { default: "Hidden for this class" }
  );

  const options = tasks
    .map((task) => {
      const title = task?.i18nContent?.[locale]?.title || task?.title;
      const hidden = hiddenIds.has(task.id);
      return {
        key: task.id,
        value: task.id,
        disabled: hidden,
        hidden,
        content: (
          <div className="dropdownOption">
            <div className="title">{title}</div>
            {hidden ? (
              <div className="subtitle">{hiddenLabel}</div>
            ) : null}
          </div>
        ),
        text: task?.title,
      };
    })
    .sort((a, b) => Number(a.hidden) - Number(b.hidden));

  const hiddenCount = options.filter((option) => option.hidden).length;

  return (
    <>
      <Dropdown
        placeholder={t("reviewDetail.addTaskSuggestion")}
        fluid
        selection
        multiple
        search
        options={options.map(({ hidden, ...option }) => option)}
        renderLabel={(option) => ({
          content: hiddenIds.has(option.value)
            ? `${option.text} · ${hiddenLabel}`
            : option.text,
        })}
        onChange={(event, data) =>
          handleItemChange({
            className: "answer",
            name: name,
            value: data?.value,
          })
        }
        value={answer}
        className="dropdownSelectedTask"
      />
      {hiddenCount > 0 ? (
        <div className="taskSelectorNote">
          {t(
            "reviewDetail.hiddenTasksNote",
            { count: hiddenCount },
            {
              default:
                "{{count}} grayed-out blocks are hidden from this student's class by their teacher, so they can't use them in their study.",
            }
          )}
        </div>
      ) : null}
    </>
  );
}
