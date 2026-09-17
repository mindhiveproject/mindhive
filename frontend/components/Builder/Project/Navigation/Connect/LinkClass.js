import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_USER_CLASSES } from "../../../../Queries/User";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

const NOT_CONNECTED = "$$$-class-not-connected-$$$";

export default function LinkClass({ project, handleChange }) {
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

  const value = project?.usedInClass?.id || NOT_CONNECTED;

  return (
    <DropdownSelect
      value={value}
      options={options}
      searchableSingle
      ariaLabel={t("connectModal.linkedClass", {}, { default: "Linked class" })}
      onChange={(next) => {
        handleChange({
          target: {
            name: "usedInClass",
            value: { id: next },
          },
        });
      }}
    />
  );
}
