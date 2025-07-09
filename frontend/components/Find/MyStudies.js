import { useQuery } from "@apollo/client";

import { Dropdown } from "semantic-ui-react";
import { MY_STUDIES } from "../Queries/Study";
import useTranslation from 'next-translate/useTranslation';

const DropdownExampleMultipleSelection = ({
  mystudies,
  studies,
  handleChange,
}) => {
  const { t } = useTranslation('common');
  const onChange = (event, data) => {
    handleChange({
      target: {
        value: data.value,
        name: "studies",
        type: "array",
      },
    });
  };

  return (
    <Dropdown
      placeholder={t('studies.typeStudyTitle', 'Type study title')}
      fluid
      multiple
      search
      selection
      options={mystudies}
      onChange={onChange}
      value={studies}
    />
  );
};

export default function FindStudies({ user, studies, handleChange }) {
  const { data, error, loading } = useQuery(MY_STUDIES, {
    variables: { id: user?.id },
  });

  const mystudies = data?.studies?.map((study) => ({
    key: study.title,
    text: study.title,
    value: study.id,
  }));

  return (
    <div>
      <DropdownExampleMultipleSelection
        mystudies={mystudies || []}
        studies={studies}
        handleChange={handleChange}
      />
    </div>
  );
}
