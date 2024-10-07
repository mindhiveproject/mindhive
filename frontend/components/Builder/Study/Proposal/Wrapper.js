import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import ProposalOverview from "./Overview";
import CreateProposal from "./Create";
import ProposalPage from "./ProposalPage";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

export default function ProposalWrapper({ query, user, templates }) {
  const studyId = query?.selector;

  const { data, loading, error } = useQuery(STUDY_PROPOSALS_QUERY, {
    variables: {
      id: studyId,
    },
  });

  const refetchQueries = [
    {
      query: STUDY_PROPOSALS_QUERY,
      variables: { id: studyId },
    },
  ];

  const [proposals, setProposals] = useState(data?.study?.proposal || []);
  const [proposalMain, setProposalMain] = useState(
    data?.study?.proposalMain || {}
  );
  const [page, setPage] = useState("overview");
  const [isCopy, setIsCopy] = useState(false);
  const [proposalId, setProposalId] = useState(null);

  useEffect(() => {
    async function updateProposals() {
      setProposals(data?.study?.proposal);
      setProposalMain(data?.study?.proposalMain);
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
      />
    );
  }

  return (
    <ProposalOverview
      user={user}
      studyId={studyId}
      templates={templates}
      proposals={proposals}
      proposalMain={proposalMain}
      openProposal={openProposal}
      copyProposal={copyProposal}
      createProposal={createProposal}
    />
  );
}
