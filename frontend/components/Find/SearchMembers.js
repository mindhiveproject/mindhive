// find members by providing search parameters
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERNAMES_WHERE } from "../Queries/User";

import { Dropdown, Radio } from "semantic-ui-react";
import { GET_ALL_CLASSES } from "../Queries/Classes";
import useTranslation from 'next-translate/useTranslation';

const permissionOptions = [
  { key: "selectAll", text: "Select All", value: "selectAll" },
  {
    key: 1,
    text: "Admin",
    value: "ADMIN",
  },
  {
    key: 2,
    text: "Scientist",
    value: "SCIENTIST",
  },
  {
    key: 3,
    text: "Teacher",
    value: "TEACHER",
  },
  {
    key: 4,
    text: "Student",
    value: "STUDENT",
  },
  {
    key: 5,
    text: "Mentor",
    value: "MENTOR",
  },
  {
    key: 6,
    text: "Participant",
    value: "PARTICIPANT",
  },
];

export default function FindMembersWhere({ members, handleChange }) {
  const { t } = useTranslation('common');
  const [permissions, setPermissions] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [searchByClass, setSearchByClass] = useState(false);

  const { data: classesData } = useQuery(GET_ALL_CLASSES);

  const userClassesOptions =
    classesData?.classes?.map((cl) => ({
      key: cl?.id,
      text: cl?.title,
      value: cl?.id,
    })) || [];
  const userClassesOptionsWithSelectAll = [
    { key: "selectAll", text: t('searchMembers.selectAll', 'Select All'), value: "selectAll" },
    ...userClassesOptions,
  ];

  const { data, error, loading } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        [searchByClass ? "AND" : "OR"]: [
          {
            permissions: {
              some: { name: { in: permissions } },
            },
          },
          {
            OR: [
              { studentIn: { some: { id: { in: userClasses } } } },
              { teacherIn: { some: { id: { in: userClasses } } } },
              { mentorIn: { some: { id: { in: userClasses } } } },
            ],
          },
        ],
      },
    },
  });

  const usernames =
    data?.profiles?.map((user) => ({
      key: user.username,
      text: user.username,
      value: user.id,
    })) || [];
  const usernamesWithSelectAll = [
    { key: "selectAll", text: t('searchMembers.selectAll', 'Select All'), value: "selectAll" },
    ...usernames,
  ];

  // Permission options with translation
  const permissionOptionsTranslated = [
    { key: "selectAll", text: t('searchMembers.selectAll', 'Select All'), value: "selectAll" },
    { key: 1, text: t('searchMembers.admin', 'Admin'), value: "ADMIN" },
    { key: 2, text: t('searchMembers.scientist', 'Scientist'), value: "SCIENTIST" },
    { key: 3, text: t('searchMembers.teacher', 'Teacher'), value: "TEACHER" },
    { key: 4, text: t('searchMembers.student', 'Student'), value: "STUDENT" },
    { key: 5, text: t('searchMembers.mentor', 'Mentor'), value: "MENTOR" },
    { key: 6, text: t('searchMembers.participant', 'Participant'), value: "PARTICIPANT" },
  ];

  return (
    <div style={{ display: "grid", gridGap: "10px" }}>
      <label>{t('searchMembers.userRole', 'User role')}</label>
      <Dropdown
        placeholder={t('searchMembers.selectRole', 'Select role(s)')}
        fluid
        multiple
        search
        selection
        options={permissionOptionsTranslated}
        onChange={(e, { value }) => {
          if (value.includes("selectAll")) {
            setPermissions(
              permissionOptionsTranslated
                .filter((option) => option.value !== "selectAll")
                .map((option) => option.value)
            );
          } else {
            setPermissions(value);
          }
        }}
        value={permissions}
      />

      <div className="iconTitle">
        <div>{t('searchMembers.searchByClass', 'Search by class')}</div>
        <Radio
          toggle
          checked={searchByClass}
          onChange={() => {
            setSearchByClass(!searchByClass);
          }}
        />
      </div>

      {searchByClass && (
        <>
          <label>{t('searchMembers.classes', 'Classes')}</label>
          <Dropdown
            placeholder={t('searchMembers.selectClass', 'Select class(es)')}
            fluid
            multiple
            search
            selection
            options={userClassesOptionsWithSelectAll}
            onChange={(e, { value }) => {
              if (value.includes("selectAll")) {
                setUserClasses(
                  userClassesOptionsWithSelectAll
                    .filter((option) => option.value !== "selectAll")
                    .map((option) => option.value)
                );
              } else {
                setUserClasses(value);
              }
            }}
            value={userClasses}
          />
        </>
      )}

      <label>{t('searchMembers.users', 'Users')}</label>
      <Dropdown
        placeholder={t('searchMembers.selectUser', 'Select user(s)')}
        fluid
        multiple
        search
        selection
        options={usernamesWithSelectAll}
        onChange={(e, { value }) => {
          if (value.includes("selectAll")) {
            const updatedValue = usernames
              .filter((option) => option.value !== "selectAll")
              .map((option) => option.value);
            handleChange({
              target: {
                value: updatedValue,
                name: "members",
                type: "array",
              },
            });
          } else {
            handleChange({
              target: {
                value: value,
                name: "members",
                type: "array",
              },
            });
          }
        }}
        value={members}
      />
    </div>
  );
}
