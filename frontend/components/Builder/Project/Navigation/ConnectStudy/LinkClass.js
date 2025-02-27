import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function LinkClass({ study, handleChange }) {
  const { data, error, loading } = useQuery(GET_USER_CLASSES);

  const user = data?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };
  const myClassObjects =
    [...user?.studentIn, ...user?.teacherIn, ...user?.mentorIn] || [];
  const myClasses = myClassObjects.map((cl) => ({
    key: cl.id,
    text: cl.title,
    value: cl.id,
  }));
  const myClassesIncludingEmpty = [
    {
      key: 0,
      text: "❌  Do not connect the class",
      value: "$$$-class-not-connected-$$$",
    },
    ...myClasses,
  ];

  const selectedClass =
    study?.classes?.length && study?.classes.map((cl) => cl?.id);
  const selectedClassIncludingEmpty =
    selectedClass || "$$$-class-not-connected-$$$";

  return (
    <DropdownExampleMultipleSelection
      myClasses={myClassesIncludingEmpty}
      selectedClass={selectedClassIncludingEmpty}
      handleChange={handleChange}
    />
  );
}

const DropdownExampleMultipleSelection = ({
  myClasses,
  selectedClass,
  handleChange,
}) => {
  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "classes",
        value: data.value.includes("$$$-class-not-connected-$$$")
          ? null
          : data.value.map((id) => ({
              id,
            })),
      },
    });
  };

  return (
    <Dropdown
      placeholder=""
      fluid
      multiple
      search
      selection
      lazyLoad
      options={myClasses}
      onChange={onChange}
      value={selectedClass}
    />
  );
};
