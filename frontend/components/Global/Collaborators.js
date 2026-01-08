import { useQuery } from "@apollo/client";
import { GET_USERNAMES_WHERE } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

export default function Collaborators({
  userClasses,
  collaborators,
  handleChange,
  selectedClass,
  isStudent,
}) {
  const { t } = useTranslation('common');
  
  // Build the OR conditions for the query
  const orConditions = [];
  
  // Only show admins if user doesn't have STUDENT permission
  if (!isStudent) {
    orConditions.push({ permissions: { some: { name: { equals: "ADMIN" } } } });
  }
  
  // If a class is selected, restrict to that class only
  // Otherwise, show users from all userClasses (cross-class visibility)
  const classesToFilter = selectedClass?.id ? [selectedClass.id] : userClasses;
  
  if (classesToFilter && classesToFilter.length > 0) {
    orConditions.push(
      { studentIn: { some: { id: { in: classesToFilter } } } },
      { teacherIn: { some: { id: { in: classesToFilter } } } },
      { mentorIn: { some: { id: { in: classesToFilter } } } }
    );
  }
  
  const { data, loading, error } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        OR: orConditions,
      },
    },
    skip: orConditions.length === 0,
  });
  const profiles = data?.profiles || [];

  const usernames = profiles.map((user) => ({
    key: user.username,
    text: user.username,
    value: user.id,
  }));

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "collaborators",
        value: data.value.map((id) => ({
          id,
          username: data.options
            .filter((o) => o.value === id)
            .map((o) => o.key)[0],
        })),
      },
    });
  };

  return (
    <Dropdown
      placeholder={t('collaborators.typeUsername', 'Type username')}
      fluid
      multiple
      search
      selection
      lazyLoad
      options={usernames}
      onChange={onChange}
      value={collaborators}
    />
  );
}
