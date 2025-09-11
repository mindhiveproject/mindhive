import { Dropdown } from "semantic-ui-react";

import { useQuery } from "@apollo/client";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";

export default function TaskSelector({ name, handleItemChange, answer }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(ALL_PUBLIC_TASKS);
  const tasks = data?.tasks || [];
  const router = useRouter();
  const { locale } = router;
  const options = tasks.map((task) => ({
    key: task.id,
    value: task.id,
    content: (
      <div className="dropdownOption">
        <div className="title">{task?.i18nContent?.[locale]?.title || task?.title}</div>
      </div>
    ),
    text: task?.title,
  }));

  return (
    <Dropdown
      placeholder={t("reviewDetail.addTaskSuggestion")}
      fluid
      selection
      multiple
      search
      options={options}
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
  );
}
