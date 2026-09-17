import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_USERNAMES_WHERE } from "../Queries/User";
import DropdownSelect from "../DesignSystem/DropdownSelect";

function toId(item) {
  if (item == null) return null;
  if (typeof item === "object") return item.id || null;
  return item;
}

export default function Collaborators({
  userClasses,
  collaborators,
  handleChange,
  selectedClass,
  isStudent,
  excludeUserId,
}) {
  const { t } = useTranslation("common");

  const orConditions = [];

  if (!isStudent) {
    orConditions.push({ permissions: { some: { name: { equals: "ADMIN" } } } });
  }

  const classesToFilter = selectedClass?.id ? [selectedClass.id] : userClasses;

  if (classesToFilter && classesToFilter.length > 0) {
    orConditions.push(
      { studentIn: { some: { id: { in: classesToFilter } } } },
      { teacherIn: { some: { id: { in: classesToFilter } } } },
      { teachingTeamIn: { some: { id: { in: classesToFilter } } } },
      { mentorIn: { some: { id: { in: classesToFilter } } } }
    );
  }

  const { data } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        OR: orConditions,
      },
    },
    skip: orConditions.length === 0,
  });
  const profiles = data?.profiles || [];

  const options = profiles
    .filter((user) => !excludeUserId || user.id !== excludeUserId)
    .map((user) => ({
      value: user.id,
      label: user.username,
    }));

  const selectedIds = (collaborators || []).map(toId).filter(Boolean);

  const placeholder = t("collaborators.typeUsername", {}, {
    default: "Type username",
  });

  return (
    <DropdownSelect
      multiple
      value={selectedIds}
      options={options}
      placeholder={placeholder}
      ariaLabel={placeholder}
      onChange={(nextIds) => {
        handleChange({
          target: {
            name: "collaborators",
            value: (nextIds || []).map((id) => {
              const option = options.find(
                (o) => String(o.value) === String(id)
              );
              return {
                id,
                username: option?.label,
              };
            }),
          },
        });
      }}
    />
  );
}
