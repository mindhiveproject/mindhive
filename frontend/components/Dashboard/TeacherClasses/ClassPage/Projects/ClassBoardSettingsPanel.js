import { useMutation, useQuery } from "@apollo/client";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import { DELETE_COMPLETE_PROPOSAL } from "../../../../Mutations/Proposal";
import { GET_CLASS } from "../../../../Queries/Classes";
import {
  canDeleteProposalBoard,
  userIsProposalAdmin,
} from "../../../../Utils/proposalBoard";
import BoardSettingsFields from "./BoardSettingsFields";
import useTemplateBoardSettings from "./useTemplateBoardSettings";

// Class-level settings for one class board (student copy permission,
// curriculum, card assignment, delete). Shown as the "Board settings" tab of
// the board editor's settings popover.
export default function ClassBoardSettingsPanel({
  myclass,
  boardId,
  user,
  onDeleted,
}) {
  const classId = myclass?.id;

  const { data } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId },
    skip: !classId,
  });
  const classTemplates = data?.proposalBoards || [];
  const board = classTemplates.find((item) => item.id === boardId) ?? null;

  const settings = useTemplateBoardSettings({
    open: true,
    board,
    myclass,
    classTemplates,
  });

  const [deleteProposalBoard, { loading: deleting }] = useMutation(
    DELETE_COMPLETE_PROPOSAL,
    {
      refetchQueries: [
        { query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } },
        // The class's own board list feeds the board row above the tabs.
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    }
  );

  if (!board) return null;

  const canDelete = canDeleteProposalBoard(board, user?.id, {
    isAdmin: userIsProposalAdmin(user),
  });

  // BoardSettingsFields asks for confirmation before calling this.
  const deleteBoard = async () => {
    try {
      await deleteProposalBoard({ variables: { id: board.id } });
      onDeleted?.();
    } catch (err) {
      alert(err?.message);
    }
  };

  return (
    <BoardSettingsFields
      {...settings}
      onDelete={canDelete ? deleteBoard : undefined}
      deleting={deleting}
    />
  );
}
