import { Dropdown } from "semantic-ui-react";

import { useQuery } from "@apollo/client";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";

export default function TaskSelector({ name, handleItemChange, answer }) {
  const { data } = useQuery(ALL_PUBLIC_TASKS);
  const tasks = data?.tasks || [];

  const options = tasks.map((task) => ({
    key: task.id,
    text: task.title,
    value: task.id,
  }));

  return (
    <Dropdown
      placeholder="Select an option"
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
    />
  );
}
