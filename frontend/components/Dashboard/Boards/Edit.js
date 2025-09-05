import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import {
  OVERVIEW_PROPOSAL_BOARD_QUERY,
  GET_MY_AUTHORED_PROJECT_BOARDS,
} from "../../Queries/Proposal"; // Adjust path to your Proposal.js file

import { StyledProposal } from "../../styles/StyledProposal";
import ProposalPage from "../TeacherClasses/ClassPage/ProjectBoard/ProposalPage";

export default function EditProposal({ user, boardId }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data, loading, error } = useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
    variables: { id: boardId },
    skip: !boardId,
  });

  const goToOverview = () => {
    router.push("/dashboard/boards"); // Adjust to your teacher projects overview route
  };

  if (!user)
    return (
      <p>
        {t("projectBoard.pleaseLogin", "Please log in to edit project boards.")}
      </p>
    );
  if (loading)
    return <p>{t("projectBoard.loading", "Loading project board...")}</p>;
  if (error)
    return (
      <p>
        {t("projectBoard.error", "Error loading project board:")}{" "}
        {error.message}
      </p>
    );
  if (!data?.proposalBoard)
    return <p>{t("projectBoard.notFound", "Project board not found.")}</p>;

  return (
    <StyledProposal>
      <ProposalPage
        user={user}
        proposalId={boardId}
        goToOverview={goToOverview}
        proposalBuildMode={true}
        refetchQueries={[
          {
            query: OVERVIEW_PROPOSAL_BOARD_QUERY,
            variables: { id: boardId },
          },
          {
            query: GET_MY_AUTHORED_PROJECT_BOARDS,
            variables: { userId: user?.id },
          },
        ]}
      />
    </StyledProposal>
  );
}
