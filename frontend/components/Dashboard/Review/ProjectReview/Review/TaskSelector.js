import { Dropdown } from "semantic-ui-react";

import { useQuery } from "@apollo/client";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";

export default function TaskSelector({ name, handleItemChange, answer }) {
  const { data } = useQuery(ALL_PUBLIC_TASKS);
  const tasks = data?.tasks || [];

  const options = tasks.map((task) => ({
    key: task.id,
    value: task.id,
    content: (
      <div className="dropdownOption">
        <div className="title">{task?.title}</div>
      </div>
    ),
    text: (
      <div className="dropdownSelectedTask">
        <div className="title">{task?.title}</div>
      </div>
    ),
  }));

  return (
    <Dropdown
      placeholder="Add MindHive survey or task suggestions"
      fluid
      selection
      multiple
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
