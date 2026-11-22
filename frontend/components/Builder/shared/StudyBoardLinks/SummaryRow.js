import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { SettingRow } from "../../../Studies/Bank/Options/Links";
import { BOARD_FOR_LINKS, STUDY_BOARD_LINKS } from "./queries";

/**
 * The builder Settings line for the study ↔ board links: on a board, its
 * study; on a study, how many boards it is on. "Manage" opens the Links
 * panel (rendered by the caller, outside the Settings popover).
 */
export default function LinksSummaryRow({ boardId, studyId, onManage }) {
  const { t } = useTranslation("builder");
  const { data: boardData } = useQuery(BOARD_FOR_LINKS, {
    variables: { boardId },
    skip: !boardId,
  });
  const { data: studyData } = useQuery(STUDY_BOARD_LINKS, {
    variables: { studyId },
    skip: !!boardId || !studyId,
  });

  const none = t("studyOptions.none", {}, { default: "None" });
  const manage = t("studyBoardLinks.manage", {}, { default: "Manage" });

  if (boardId) {
    const board = boardData?.proposalBoard;
    if (!board) return null;
    return (
      <SettingRow
        label={t("studyOptions.linkedStudy", {}, { default: "Linked study" })}
        value={
          board.study
            ? board.study.title ||
              t("linkedBoard.untitledStudy", {}, { default: "Untitled study" })
            : none
        }
        actionLabel={manage}
        onAction={onManage}
      />
    );
  }

  const study = studyData?.study;
  if (!study) return null;
  const count = study.proposal.length;
  return (
    <SettingRow
      label={t("studyBoardLinks.rowLabel", {}, { default: "Project boards" })}
      value={
        count
          ? t("studyBoardLinks.onBoards", { count }, { default: "On {{count}} board(s)" })
          : none
      }
      actionLabel={manage}
      onAction={onManage}
    />
  );
}
