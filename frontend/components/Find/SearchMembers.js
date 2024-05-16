// find members by providing search parameters
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERNAMES_WHERE } from "../Queries/User";

import { Dropdown, Radio } from "semantic-ui-react";
import { GET_ALL_CLASSES } from "../Queries/Classes";

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
    { key: "selectAll", text: "Select All", value: "selectAll" },
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
    { key: "selectAll", text: "Select All", value: "selectAll" },
    ...usernames,
  ];

  return (
    <div style={{ display: "grid", gridGap: "10px" }}>
      <label>User role</label>
      <Dropdown
        placeholder="Select role(s)"
        fluid
        multiple
        search
        selection
        options={permissionOptions}
        onChange={(e, { value }) => {
          if (value.includes("selectAll")) {
            // Select all options except the 'Select All' option itself
            setPermissions(
              permissionOptions
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
        <div>Search by class</div>
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
          <label>Classes</label>
          <Dropdown
            placeholder="Select class(es)"
            fluid
            multiple
            search
            selection
            options={userClassesOptionsWithSelectAll}
            onChange={(e, { value }) => {
              if (value.includes("selectAll")) {
                // Select all options except the 'Select All' option itself
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

      <label>Users</label>
      <Dropdown
        placeholder="Select user(s)"
        fluid
        multiple
        search
        selection
        options={usernamesWithSelectAll}
        onChange={(e, { value }) => {
          if (value.includes("selectAll")) {
            // Select all options except the 'Select All' option itself
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
