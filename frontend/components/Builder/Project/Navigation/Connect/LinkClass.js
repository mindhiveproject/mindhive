import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function LinkClass({ classes, study, handleChange }) {
  const myClasses =
    classes?.map((cl) => ({
      key: cl.id,
      text: cl.title,
      value: cl.id,
    })) || [];

  const selectedClass = study?.class?.id;

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "class",
        value: classes?.filter((c) => c?.id === data.value)[0],
      },
    });
  };

  return (
    <Dropdown
      placeholder=""
      fluid
      search
      selection
      lazyLoad
      options={myClasses}
      onChange={onChange}
      value={selectedClass}
    />
  );
}
