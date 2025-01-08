import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import ProposalOverview from "./Overview";
import CreateProposal from "./Create";
import ProposalPage from "./ProposalPage";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";

export default function ProposalWrapper({ myclass, query, user, templates }) {
  const studyId = query?.selector;

  const { data, loading, error } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: {
      classId: myclass?.id,
    },
  });

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId: myclass?.id },
    },
  ];

  const [proposals, setProposals] = useState(data?.proposalBoards || []);
  const [page, setPage] = useState("overview");
  const [isCopy, setIsCopy] = useState(false);
  const [proposalId, setProposalId] = useState(null);

  useEffect(() => {
    async function updateProposals() {
      setProposals(data?.proposalBoards);
    }
    if (data) {
      updateProposals();
    }
  }, [data]);

  const openProposal = (proposalId) => {
    setPage("proposal");
    setProposalId(proposalId);
  };

  const copyProposal = (proposalId) => {
    setProposalId(proposalId);
    setPage("create");
    setIsCopy(true);
  };

  const createProposal = () => {
    setProposalId(null);
    setPage("create");
    setIsCopy(false);
  };

  const goToOverview = () => {
    setPage("overview");
  };

  if (page === "create") {
    return (
      <CreateProposal
        myclass={myclass}
        studyId={studyId}
        copyProposalId={proposalId}
        templates={templates}
        isCopy={isCopy}
        goToOverview={goToOverview}
      />
    );
  }

  if (page === "proposal" && proposalId) {
    return (
      <ProposalPage
        user={user}
        studyId={studyId}
        proposalId={proposalId}
        goToOverview={goToOverview}
        refetchQueries={refetchQueries}
        proposalBuildMode
      />
    );
  }

  return (
    <ProposalOverview
      myclass={myclass}
      user={user}
      studyId={studyId}
      templates={templates}
      proposals={proposals}
      // proposalMain={proposalMain}
      openProposal={openProposal}
      copyProposal={copyProposal}
      createProposal={createProposal}
    />
  );
}
