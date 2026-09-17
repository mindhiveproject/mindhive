import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_USER_CLASSES } from "../../../../Queries/User";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

const NOT_CONNECTED = "$$$-class-not-connected-$$$";

export default function LinkClass({ study, handleChange }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(GET_USER_CLASSES);

  const user = data?.authenticatedItem || {
    studentIn: [],
    teacherIn: [],
    teachingTeamIn: [],
    mentorIn: [],
  };

  const myClassObjects = [
    ...(user.studentIn || []),
    ...(user.teacherIn || []),
    ...(user.teachingTeamIn || []),
    ...(user.mentorIn || []),
  ];

  const notConnectedLabel = t("linkClass.doNotConnectClass", {}, {
    default: "Do not connect to class",
  });

  const options = [
    {
      value: NOT_CONNECTED,
      label: notConnectedLabel,
    },
    ...myClassObjects.map((cl) => ({
      value: cl.id,
      label: cl.title,
    })),
  ];

  const selectedIds = (study?.classes || [])
    .map((cl) => cl?.id)
    .filter(Boolean);
  const value = selectedIds.length ? selectedIds : [NOT_CONNECTED];

  return (
    <DropdownSelect
      multiple
      value={value}
      options={options}
      ariaLabel={t("connectStudyModal.linkedClass", {}, {
        default: "Linked class",
      })}
      onChange={(next) => {
        const ids = Array.isArray(next) ? next : [];
        handleChange({
          target: {
            name: "classes",
            value: ids.includes(NOT_CONNECTED)
              ? null
              : ids.map((id) => ({ id })),
          },
        });
      }}
    />
  );
}
