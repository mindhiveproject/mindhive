import { useQuery } from "@apollo/client";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_CLASSES } from "../../../../Queries/Classes";

export default function ClassSelector({ user, inputs, handleChange }) {
  const { t } = useTranslation("classes");
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

  // Ensure classes is always an array
  const classesArray = Array.isArray(inputs?.classes) 
    ? inputs.classes 
    : inputs?.classes 
      ? [inputs.classes] 
      : [];
  const selectedClasses = classesArray.map((c) => c?.id || c) || [];

  return (
    <div className="consentSelector">
      <p>{t("assignment.classes")}</p>
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
  const { t } = useTranslation("classes");
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
      placeholder={t("assignment.typeClassName")}
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
