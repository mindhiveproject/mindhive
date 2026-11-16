import { gql, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_USER_CLASSES } from "../../../../Queries/User";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import MessageCard from "../../../../DesignSystem/MessageCard";
import {
  boardHasSubmittedWork,
  classStaffIds,
} from "../../../../../lib/mainProject";

const NOT_CONNECTED = "$$$-class-not-connected-$$$";

// What decides whether the board may still change class. The server enforces
// it (keystone/lib/mainProject.js); this only explains it before saving.
const BOARD_CLASS_STATE = gql`
  query BOARD_CLASS_STATE($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      isMain
      isSubmitted
      submitProposalStatus
      peerFeedbackStatus
      projectReportStatus
      milestoneStatus
      reviewsCount
      usedInClass {
        id
        title
        creator {
          id
        }
        teachingTeam {
          id
        }
        mentors {
          id
        }
      }
    }
  }
`;

const isAdminUser = (user) =>
  (user?.permissions || []).some((p) => p?.name === "ADMIN");

export default function LinkClass({ project, user: viewer, handleChange }) {
  const { t } = useTranslation("builder");
  const { data } = useQuery(GET_USER_CLASSES);
  const { data: stateData } = useQuery(BOARD_CLASS_STATE, {
    variables: { id: project?.id },
    skip: !project?.id,
    fetchPolicy: "cache-and-network",
  });
  const saved = stateData?.proposalBoard;
  const savedClass = saved?.usedInClass;

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

  // The class's teachers and mentors (and admins) can always move a board.
  // Anyone else can no longer move it once it is a main project or has
  // submitted or reviewed work in its class.
  const canAlwaysMove =
    isAdminUser(viewer) ||
    (!!viewer?.id && classStaffIds(savedClass).has(viewer.id));
  let lockReason = null;
  if (savedClass?.id && !canAlwaysMove) {
    if (saved.isMain) {
      lockReason = t("linkClass.lockedMain", { title: savedClass.title }, {
        default: `This is a main project in ${savedClass.title}, so it cannot be moved to another class. You can have one main project per class. To move it, remove it as main project first, or ask the support team for help.`,
      });
    } else if (boardHasSubmittedWork(saved)) {
      lockReason = t("linkClass.lockedSubmitted", { title: savedClass.title }, {
        default: `This project has work that was submitted or reviewed in ${savedClass.title}, so it cannot be moved to another class. If it is in the wrong class, the support team can help.`,
      });
    }
  }

  // Before saving a change: what linking or moving means.
  let notice = null;
  const savedValue = savedClass?.id || NOT_CONNECTED;
  if (!lockReason && saved && value !== savedValue) {
    if (!savedClass?.id) {
      notice = t("linkClass.firstLinkNotice", {}, {
        default:
          "Check that this is the right class. Its teacher will see this project, and you can have one main project per class. Once this is your main project or you have submitted work, it can no longer be moved to another class.",
      });
    } else if (!canAlwaysMove) {
      notice = t("linkClass.moveNotice", { title: savedClass.title }, {
        default: `This takes the project out of ${savedClass.title}: its teacher will no longer see it. It can only move to a class that uses the same project board.`,
      });
    } else {
      notice = t("linkClass.staffMoveNotice", { title: savedClass.title }, {
        default: `This takes the project out of ${savedClass.title}. If it is a main project, it will stop being one.`,
      });
    }
  }

  return (
    <>
      <DropdownSelect
        portal
        value={value}
        options={options}
        searchableSingle
        disabled={!!lockReason}
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
      {lockReason && <MessageCard variant="neutral" message={lockReason} />}
      {notice && <MessageCard variant="information" message={notice} />}
    </>
  );
}
