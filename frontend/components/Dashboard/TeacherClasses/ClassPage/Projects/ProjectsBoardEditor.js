import { useRouter } from "next/router";

import styled from 'styled-components';

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import {
  StyledActionCard,
  StyledProposal,
  StyledProposalCard,
} from '../../../../styles/StyledProposal';
import ProposalPage from "./ProjectBoard/ProposalPage";

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

export default function ProjectsBoardEditor({ myclass, user, boardId }) {
  const router = useRouter();
  const autoOpenAddMilestone = router.query.addMilestone === "1";

  const projectsHref = {
    pathname: `/dashboard/myclasses/${myclass?.code}`,
    query: { page: "projects" },
  };

  const onBack = () => {
    router.push(projectsHref);
  };

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId: myclass?.id },
    },
  ];

  return (
    <StyledProjectsBoardEditor className="projectsBoardEditor">
      <StyledProposal className="projectsBoardEditorProposal">
        <ProposalPage
          user={user}
          proposalId={boardId}
          onBack={onBack}
          showBackButton={false}
          proposalBuildMode
          refetchQueries={refetchQueries}
          autoOpenAddMilestone={autoOpenAddMilestone}
        />
      </StyledProposal>
    </StyledProjectsBoardEditor>
  );
}
