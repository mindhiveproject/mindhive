import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { Sidebar } from "semantic-ui-react";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../Queries/Proposal";
import Button from "../../../DesignSystem/Button";
import { StyledProposal } from "../../../styles/StyledProposal";
import ProposalPage from "./ProjectBoard/ProposalPage";

export default function ProjectsBoardEditor({ myclass, user, boardId }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

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
    <Sidebar.Pushable style={{ overflowY: "hidden" }}>
      <div className="projectsBoardBackBar">
        <Button variant="outline" type="button" onClick={onBack}>
          ← {t("projects.backToClass", {}, { default: "Back to class" })}
        </Button>
      </div>
      <StyledProposal>
        <ProposalPage
          user={user}
          proposalId={boardId}
          onBack={onBack}
          showBackButton={false}
          proposalBuildMode
          refetchQueries={refetchQueries}
        />
      </StyledProposal>
    </Sidebar.Pushable>
  );
}
