import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import ProposalOverview from "./Overview";
import CreateProposal from "./Create";
import ProposalPage from "./ProposalPage";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import { PROPOSAL_TEMPLATES_QUERY } from "../../../Queries/Proposal";

export default function ProposalWrapper({ query, user, onRequestConnectClass }) {
  const studyId = query?.selector;

  const { data, loading } = useQuery(STUDY_PROPOSALS_QUERY, {
    variables: {
      id: studyId,
    },
  });

  const { data: templatesData } = useQuery(PROPOSAL_TEMPLATES_QUERY);
  const templates = templatesData?.proposalBoards || [];

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
    if (data) {
      setProposals(data?.study?.proposal);
      setProposalMain(data?.study?.proposalMain);
    }
  }, [data]);

  const openProposal = (nextProposalId) => {
    const url = `/builder/projects?selector=${nextProposalId}`;
    window.open(url, "_blank");
  };

  const copyProposal = (nextProposalId) => {
    setProposalId(nextProposalId);
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
      studyId={studyId}
      studyClasses={data?.study?.classes || []}
      classesLoading={loading && !data}
      proposals={proposals}
      proposalMain={proposalMain}
      openProposal={openProposal}
      copyProposal={copyProposal}
      createProposal={createProposal}
      onRequestConnectClass={onRequestConnectClass}
    />
  );
}
