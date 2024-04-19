import { useRouter } from "next/router";
import Page from "../../components/Global/Page";

import dynamic from "next/dynamic";

const importProposalPDF = () => import("../../components/Proposal/PDF/Export");

const ProposalPDF = dynamic(importProposalPDF, {
  ssr: false,
});

const ProposalPage = () => {
  const router = useRouter();
  if (!router.query.id)
    return (
      <Page>
        <h1>Loading ...</h1>
      </Page>
    );
  return (
    <Page>
      <ProposalPDF proposalId={router.query.id} />
    </Page>
  );
};

export default ProposalPage;
