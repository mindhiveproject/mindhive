import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import styled from 'styled-components';

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import {
  StyledActionCard,
  StyledProposal,
  StyledProposalCard,
} from '../../../../styles/StyledProposal';
import ProposalPage from "./ProjectBoard/ProposalPage";
import ClassBoardSettingsPanel from "./ClassBoardSettingsPanel";

const StyledProjectsBoardEditor = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow-x: visible;
  overflow-y: hidden;

  .proposalBoard {
    margin: 0 !important;
  }

  ${StyledProposalCard},
  ${StyledActionCard} {
    box-shadow: none !important;
  }
`;

export default function ProjectsBoardEditor({
  myclass,
  user,
  boardId,
  // Class tab to return to when leaving the editor.
  page = "settings",
}) {
  const router = useRouter();
  const autoOpenAddMilestone = router.query.addMilestone === "1";
  // `boardSettings=1` (the settings gear on a board tile) opens the editor
  // with its settings popover open. Read once, then drop it from the URL so a
  // reload doesn't reopen it.
  const [openSettingsOnMount] = useState(
    () => router.query.boardSettings === "1"
  );
  useEffect(() => {
    const { boardSettings, ...restQuery } = router.query;
    if (!boardSettings) return;
    router.replace(
      { pathname: router.pathname, query: restQuery },
      undefined,
      { shallow: true }
    );
  }, [router]);

  const onBack = () => {
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page },
    });
  };

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId: myclass?.id },
    },
  ];

  return (
    <StyledProjectsBoardEditor className="projectsBoardEditor">
      <StyledProposal className="projectsBoardEditorProposal" $flush>
        <ProposalPage
          user={user}
          proposalId={boardId}
          onBack={onBack}
          showBackButton={false}
          proposalBuildMode
          refetchQueries={refetchQueries}
          autoOpenAddMilestone={autoOpenAddMilestone}
          openSettingsOnMount={openSettingsOnMount}
          boardSettings={
            <ClassBoardSettingsPanel
              myclass={myclass}
              boardId={boardId}
              user={user}
              onDeleted={onBack}
            />
          }
        />
      </StyledProposal>
    </StyledProjectsBoardEditor>
  );
}
