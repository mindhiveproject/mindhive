import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_USER_CLASSES } from "../../../../Queries/User";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";

const NOT_CONNECTED = "$$$-class-not-connected-$$$";

export default function LinkClass({ study, handleChange, portal = false }) {
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
    // A class can appear in several roles (e.g. teacher and student).
    ...myClassObjects
      .filter((cl, i, all) => cl?.id && all.findIndex((c) => c?.id === cl.id) === i)
      .map((cl) => ({
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
      portal={portal}
      value={value}
      options={options}
      ariaLabel={t("connectStudyModal.linkedClass", {}, {
        default: "Linked class",
      })}
      onChange={(next) => {
        const ids = Array.isArray(next) ? next : [];
        // "Do not connect" and the classes exclude each other. While it is
        // selected, picking a class arrives with it still in the list: the
        // option that was just clicked wins.
        const pickedNotConnected =
          ids.includes(NOT_CONNECTED) && !value.includes(NOT_CONNECTED);
        const classIds = ids.filter((id) => id !== NOT_CONNECTED);
        handleChange({
          target: {
            name: "classes",
            value:
              pickedNotConnected || !classIds.length
                ? null
                : classIds.map((id) => ({ id })),
          },
        });
      }}
    />
  );
}
