import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function LinkClass({ classes, project, handleChange }) {
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

  const selectedClass = project?.usedInClass?.id;

  const selectedClassIncludingEmpty =
    selectedClass || "$$$-class-not-connected-$$$";

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "usedInClass",
        value: { id: data?.value },
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
      options={myClassesIncludingEmpty}
      onChange={onChange}
      value={selectedClassIncludingEmpty}
    />
  );
}
