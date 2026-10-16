import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { STUDENT_SELECTABLE_TASKS } from "../../../../../Queries/Task";
import { hiddenTaskIdsFor } from "../../../../../../lib/taskBankFilter";
import {
  getStudentPickedTasks,
  getTemplateLinkedTasks,
} from "../../../../../../lib/studentTaskSelection";
import DropdownSelect from "../../../../../DesignSystem/DropdownSelect";
import { StarFilledIcon } from "../../../../../DesignSystem/Icons";

// Tasks and surveys the students picked for their copy of a card, when the
// teacher turned on settings.studentTaskSelection on the template card.
// Picks are saved in the card's `tasks` next to the teacher-linked ones, and
// listed in settings.studentTaskIds so template propagation keeps them.
// Choices come from the public tasks and surveys the board's class doesn't
// block (Class.hiddenTasks).
export default function StudentTaskPicker({
  proposalCard,
  classId,
  user,
  disabled = false,
  onChange,
}) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();

  const { data } = useQuery(STUDENT_SELECTABLE_TASKS, {
    variables: { classId: classId || "", skipClass: !classId },
  });

  const linkedTaskIds = useMemo(
    () => new Set(getTemplateLinkedTasks(proposalCard).map((task) => task.id)),
    [proposalCard]
  );

  const hiddenIds = useMemo(
    () =>
      new Set(
        classId
          ? (data?.class?.hiddenTasks || []).map((task) => task.id)
          : hiddenTaskIdsFor(user)
      ),
    [classId, data?.class?.hiddenTasks, user]
  );

  const taskTitle = (task) =>
    task?.i18nContent?.[locale]?.title || task?.title || "";

  // Teacher-linked tasks are already on the card, so they aren't offered.
  const selectableTasks = (data?.tasks || []).filter(
    (task) => !hiddenIds.has(task.id) && !linkedTaskIds.has(task.id)
  );
  const groupLabels = {
    TASK: t("mainCard.studentTasks.tasksGroup", {}, { default: "Tasks" }),
    SURVEY: t("mainCard.studentTasks.surveysGroup", {}, { default: "Surveys" }),
  };
  // The student's favorites come first, under their own header, starred.
  const favoriteIds = new Set(
    (user?.favoriteTasks || []).map((task) => task?.id)
  );
  const favoritesGroup = t(
    "mainCard.studentTasks.favoritesGroup",
    {},
    { default: "Your favorites" }
  );
  const taskOption = (task) => {
    const title = taskTitle(task);
    if (!favoriteIds.has(task.id)) {
      return { value: task.id, label: title, group: groupLabels[task.taskType] };
    }
    return {
      value: task.id,
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <StarFilledIcon
            width={16}
            height={16}
            style={{ color: "#F2BE42", flexShrink: 0 }}
          />
          {title}
        </span>
      ),
      labelText: title,
      group: favoritesGroup,
    };
  };
  // Picks the class has blocked since stay on the card, but can only be removed.
  const pickedTasks = getStudentPickedTasks(proposalCard);
  const selectableIds = new Set(selectableTasks.map((task) => task.id));
  const blockedPickOptions = pickedTasks
    .filter((task) => !selectableIds.has(task.id))
    .map((task) => ({
      value: task.id,
      label: `${taskTitle(task)} · ${t(
        "reviewDetail.taskHiddenForClass",
        {},
        { default: "Hidden for this class" }
      )}`,
    }));
  // Favorites first so their group heads the list.
  const options = [
    ...blockedPickOptions,
    ...selectableTasks
      .filter((task) => favoriteIds.has(task.id))
      .map(taskOption),
    ...selectableTasks
      .filter((task) => !favoriteIds.has(task.id))
      .map(taskOption),
  ];

  const handleChange = (nextIds) => {
    const byId = new Map(
      [...pickedTasks, ...selectableTasks].map((task) => [task.id, task])
    );
    const picks = nextIds.map((id) => byId.get(id)).filter(Boolean);
    onChange?.(picks);
  };

  return (
    <div className="proposalCardStudentTasks" style={{ display: "grid", gap: "8px" }}>
      <div className="cardSubheader">
        {t("mainCard.studentTasks.title", {}, { default: "Your tasks & surveys" })}
      </div>
      <div className="cardSubheaderComment">
        {t(
          "mainCard.studentTasks.description",
          {},
          {
            default:
              "Pick the tasks and surveys you plan to use for this part of your project.",
          }
        )}
      </div>
      {/* The trigger lists the picks, so there are no chips below it. */}
      <DropdownSelect
        multiple
        value={pickedTasks.map((task) => task.id)}
        onChange={handleChange}
        options={options}
        placeholder={t(
          "mainCard.studentTasks.placeholder",
          {},
          { default: "Add a task or survey" }
        )}
        ariaLabel={t(
          "mainCard.studentTasks.title",
          {},
          { default: "Your tasks & surveys" }
        )}
        disabled={disabled}
      />
    </div>
  );
}
