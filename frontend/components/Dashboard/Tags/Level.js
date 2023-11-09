import { useQuery } from "@apollo/client";

import { Dropdown } from "semantic-ui-react";

export default function LevelSelector({ handleChange, level }) {
  const levels = [
    { key: 1, text: "First-level", value: "1" },
    { key: 2, text: "Second-level", value: "2" },
    { key: 3, text: "Third-level", value: "3" },
  ];

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "level",
        value: data?.value,
      },
    });
  };

  return (
    <div>
      <label htmlFor="level">
        Tag level
        <Dropdown
          placeholder=""
          fluid
          search
          selection
          lazyLoad
          options={levels}
          onChange={onChange}
          value={level}
        />
      </label>
    </div>
  );
}
