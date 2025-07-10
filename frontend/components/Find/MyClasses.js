import { useQuery } from "@apollo/client";

import { Dropdown } from "semantic-ui-react";
import { GET_CLASSES } from "../Queries/Classes";
import useTranslation from 'next-translate/useTranslation';

const DropdownExampleMultipleSelection = ({
  myclasses,
  classes,
  handleChange,
}) => {
  const { t } = useTranslation('common');
  const onChange = (event, data) => {
    handleChange({
      target: {
        value: data.value,
        name: "classes",
        type: "array",
      },
    });
  };

  return (
    <Dropdown
      placeholder={t('classes.typeClassTitle', 'Type class title')}
      fluid
      multiple
      search
      selection
      options={myclasses}
      onChange={onChange}
      value={classes}
    />
  );
};

export default function FindClasses({ user, classes, handleChange }) {
  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        OR: [
          { creator: { id: { equals: user?.id } } },
          { students: { some: { id: { equals: user?.id } } } },
          { mentors: { some: { id: { equals: user?.id } } } },
        ],
      },
    },
  });

  const myclasses = data?.classes?.map((myclass) => ({
    key: myclass.title,
    text: myclass.title,
    value: myclass.id,
  }));

  return (
    <div>
      <DropdownExampleMultipleSelection
        myclasses={myclasses || []}
        classes={classes}
        handleChange={handleChange}
      />
    </div>
  );
}
