import { useState } from "react";
import ProposalOverview from "./Overview";

import CreateProposal from "./Create";
import ProposalPage from "./ProposalPage";
import { useQuery } from "@apollo/client";
import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Proposal";

export default function ProposalWrapper({ user, study, templates }) {
  const { data, loading, error } = useQuery(STUDY_PROPOSALS_QUERY, {
    variables: {
      studyId: study?.id,
    },
  });

  const proposals = data?.proposalBoards || [];

  const [page, setPage] = useState("overview");
  const [isCopy, setIsCopy] = useState(false);
  const [proposalId, setProposalId] = useState(null);

  const openProposal = (proposalId) => {
    setPage("proposal");
    setProposalId(proposalId);
  };

  const copyProposal = (proposalId) => {
    setPage("create");
    setIsCopy(true);
    setProposalId(proposalId);
  };

  const createProposal = () => {
    setPage("create");
    setIsCopy(false);
  };

  const goToOverview = () => {
    setPage("overview");
  };

  if (page === "create") {
    return (
      <CreateProposal
        study={study}
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
        study={study}
        proposalId={proposalId}
        goToOverview={goToOverview}
      />
    );
  }

  return (
    <ProposalOverview
      user={user}
      study={study}
      templates={templates}
      proposals={proposals}
      openProposal={openProposal}
      copyProposal={copyProposal}
      createProposal={createProposal}
    />
  );
}
