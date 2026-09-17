import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import ProposalOverview from "./Overview";
import CreateProposal from "./Create";
import ProposalPage from "./ProposalPage";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import { PROPOSAL_TEMPLATES_QUERY } from "../../../Queries/Proposal";

function boardToOpen(study) {
  const boards = study?.proposal || [];
  if (boards.length !== 1) return null;
  return study?.proposalMain?.id || boards[0]?.id || null;
}

export default function ProposalWrapper({ query, user, onRequestConnectClass }) {
  const router = useRouter();
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

  useEffect(() => {
    const selector = boardToOpen(data?.study);
    if (!selector) return;
    router.replace({
      pathname: "/builder/projects",
      query: { selector },
    });
  }, [data, router]);

  const openProposal = (nextProposalId) => {
    router.push({
      pathname: "/builder/projects",
      query: { selector: nextProposalId },
    });
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

  if (loading && !data) {
    return null;
  }

  if (boardToOpen(data?.study)) {
    return null;
  }

  return (
    <ProposalOverview
      studyId={studyId}
      studyClasses={data?.study?.classes || []}
      classesLoading={loading && !data}
      proposals={proposals}
      proposalMain={proposalMain}
      openProposal={openProposal}
      onRequestConnectClass={onRequestConnectClass}
    />
  );
}
