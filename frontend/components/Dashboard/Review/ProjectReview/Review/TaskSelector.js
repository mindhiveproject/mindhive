import { useMemo } from "react";

import { useQuery } from "@apollo/client";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { getLocalizedField } from "../../../../../lib/i18nContent";

// `hiddenTaskIds` is the project class's block list (Class.hiddenTasks).
// Those tasks stay listed but disabled and sorted last, so mentors see what
// exists without suggesting blocks the students can't use. Suggestions saved
// before the teacher hid a task are kept, tagged, and can still be removed.
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
  const selected = answer || [];

  const options = tasks
    .map((task) => {
      const title = getLocalizedField(task, "title", locale);
      const hidden = hiddenIds.has(task.id);
      return {
        value: task.id,
        label: hidden ? `${title} · ${hiddenLabel}` : title,
        // A hidden task already suggested stays enabled so it can be removed.
        disabled: hidden && !selected.includes(task.id),
        hidden,
      };
    })
    .sort((a, b) => Number(a.hidden) - Number(b.hidden));

  const hiddenCount = options.filter((option) => option.hidden).length;

  return (
    <>
      <DropdownSelect
        multiple
        placeholder={t("reviewDetail.addTaskSuggestion")}
        ariaLabel={t("reviewDetail.addTaskSuggestion")}
        options={options.map(({ hidden, ...option }) => option)}
        value={selected}
        onChange={(next) =>
          handleItemChange({
            className: "answer",
            name,
            value: next,
          })
        }
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
