import { useQuery } from "@apollo/client";
import { GET_USER_CLASSES } from "../../../Queries/User";

import { Dropdown } from "semantic-ui-react";

export default function LinkClass({
  classes,
  project,
  handleChange,
  refetchUserProjectsInClass,
}) {
  const { data, error, loading } = useQuery(GET_USER_CLASSES);

  const user = data?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    mentorIn: [],
  };

  const myClassObjects = [...user?.studentIn] || [];

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

  const selectedClass = project?.class?.id;

  const selectedClassIncludingEmpty =
    selectedClass || "$$$-class-not-connected-$$$";

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "class",
        value: classes?.filter((cl) => cl?.id === data?.value)[0],
      },
    });
    refetchUserProjectsInClass();
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
