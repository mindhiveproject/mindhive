import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import { getLocalizedField } from "../../../lib/i18nContent";

// Tasks & surveys students picked on a card (see lib/studentTaskSelection),
// as chips. Used on the Feedback Center project cards and on the
// project review page. `highlightedIds` marks the ones matching the task
// filter; `showEmpty` prints a line when there is nothing to show.
export default function StudentTaskChips({
  tasks = [],
  highlightedIds,
  showEmpty = false,
  className = "",
}) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();

  if (!tasks.length) {
    return showEmpty ? (
      <div className={`studentTasksEmpty ${className}`.trim()}>
        {t("review.noStudentPickedTasks", {}, {
          default: "No tasks or surveys picked",
        })}
      </div>
    ) : null;
  }

  return (
    <div
      className={`suggestedTasks studentTasks ${className}`.trim()}
      aria-label={t("review.studentPickedTasks", {}, {
        default: "Tasks and surveys picked by students",
      })}
    >
      {tasks.map((task) => (
        <Chip
          key={task.id}
          label={getLocalizedField(task, "title", locale)}
          variant="static"
          tone={highlightedIds?.has(task.id) ? "info" : "default"}
          title={t("review.studentPickedTask", {}, {
            default: "Picked by students",
          })}
          style={{ maxWidth: "100%" }}
        />
      ))}
    </div>
  );
}
