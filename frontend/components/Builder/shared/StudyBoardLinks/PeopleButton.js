import { useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../../DesignSystem/IconButton";
import ConnectFacepile, {
  CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE,
  ConnectFacepileChevron,
} from "../../Project/Navigation/ConnectFacepile";
import { facepilePeople } from "../../../../lib/studyBoardLinks";
import StudyBoardLinksModal from "./Modal";
import { BOARD_FOR_LINKS, STUDY_BOARD_LINKS } from "./queries";

/**
 * The builder header's people: a facepile that depends on where the viewer
 * is, opening the Links panel for that place.
 * - `boardId` (board tab): the board's author and collaborators.
 * - `studyId` (study tabs): everyone who edits the study, directly or
 *   through a linked board.
 */
export default function PeopleButton({
  user,
  boardId,
  studyId,
  // On a board's study tabs: that board (see StudyBoardLinksPanel).
  currentBoardId,
  presence,
  hasUnsavedChanges,
}) {
  const { t } = useTranslation("builder");
  const [open, setOpen] = useState(false);

  const { data: boardData } = useQuery(BOARD_FOR_LINKS, {
    variables: { boardId },
    skip: !boardId,
  });
  const { data: studyData } = useQuery(STUDY_BOARD_LINKS, {
    variables: { studyId },
    skip: !!boardId || !studyId,
  });

  const board = boardId ? boardData?.proposalBoard : null;
  const study = boardId ? null : studyData?.study;
  if (!board && !study) return null;

  const label = t("studyBoardLinks.peopleButton", {}, { default: "People and links" });

  return (
    <div className="connectArea">
      <ConnectFacepile
        collaborators={facepilePeople({ board, study })}
        presence={presence}
      >
        <IconButton
          variant="subtle"
          elevated={false}
          ariaLabel={label}
          title={label}
          icon={<ConnectFacepileChevron />}
          style={CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE}
          onClick={() => setOpen(true)}
        />
      </ConnectFacepile>
      <StudyBoardLinksModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        boardId={boardId}
        studyId={boardId ? undefined : studyId}
        currentBoardId={currentBoardId}
        hasUnsavedChanges={hasUnsavedChanges}
        // The builder shows the board's study: reload on the new one.
        onContextBoardChanged={() => window.location.reload()}
      />
    </div>
  );
}
