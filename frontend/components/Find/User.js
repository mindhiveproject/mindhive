import { useQuery } from "@apollo/client";
import { GET_USERNAMES_WHERE } from "../Queries/User";

import { Dropdown } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

export default function FindUser({ userClasses, authorId, setAuthorId }) {
  const { t } = useTranslation('common');
  const { data, loading, error } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        OR: [
          { permissions: { some: { name: { equals: "ADMIN" } } } }, // get all admins
          { studentIn: { some: { id: { in: userClasses } } } },
          { teacherIn: { some: { id: { in: userClasses } } } },
          { mentorIn: { some: { id: { in: userClasses } } } },
        ],
      },
    },
  });

  const users = data?.profiles?.map((user) => ({
    key: user.username,
    text: user.username,
    value: user.id,
  }));

  return (
    <Dropdown
      placeholder={t('members.typeUsername', 'Type username')}
      search
      selection
      options={users || []}
      onChange={(event, data) => {
        setAuthorId(data?.value);
      }}
      value={authorId}
    />
  );
}
