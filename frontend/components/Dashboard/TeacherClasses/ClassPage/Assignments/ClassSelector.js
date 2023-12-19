import { useQuery } from "@apollo/client";
import { Dropdown } from "semantic-ui-react";

import { GET_CLASSES } from "../../../../Queries/Classes";

export default function ClassSelector({ user, inputs, handleChange }) {
  const { data, loading, error } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        OR: [
          {
            creator: {
              id: { equals: user?.id },
            },
          },
          {
            mentors: {
              some: { id: { equals: user?.id } },
            },
          },
        ],
      },
    },
  });

  const myClasses = data?.classes.map((myClass) => ({
    key: myClass.id,
    text: myClass.title,
    value: myClass.id,
  }));

  const selectedClasses = inputs?.classes?.map((c) => c?.id) || [];

  return (
    <div className="consentSelector">
      <p>Class(es)</p>
      <DropdownExampleMultipleSelection
        classes={myClasses}
        selectedClasses={selectedClasses}
        handleChange={handleChange}
      />
    </div>
  );
}

const DropdownExampleMultipleSelection = ({
  classes,
  selectedClasses,
  handleChange,
}) => {
  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "classes",
        value: data.value.map((v) => ({ id: v })),
      },
    });
  };

  return (
    <Dropdown
      placeholder="Type class name"
      fluid
      multiple
      search
      selection
      options={classes}
      onChange={onChange}
      value={selectedClasses}
    />
  );
};
