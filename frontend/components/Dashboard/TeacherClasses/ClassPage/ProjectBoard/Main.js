import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import InDev from "../../../../Global/InDev";
import ProposalWrapper from "./Wrapper";

import { PROPOSAL_TEMPLATES_QUERY } from "../../../../Queries/Proposal";

import { StyledProposal } from "../../../../styles/StyledProposal";

import { Sidebar } from "semantic-ui-react";

export default function ProjectBoard({ myclass, query, user }) {
  const { t } = useTranslation("classes");
  const { data, error, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);

  const templates = data?.proposalBoards || [];

  if (templates.length === 0) {
    return (
      <>
        <InDev
          header={t("projectBoard.noTemplatesHeader")}
          message={t("projectBoard.noTemplatesMessage")}
        />
      </>
    );
  }

  return (
    <Sidebar.Pushable>
      <Link
        href={{
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: {
            page: "projects",
          },
        }}
      >
        <div>{t("projectBoard.back")}</div>
      </Link>

      <StyledProposal>
        <ProposalWrapper
          myclass={myclass}
          query={query}
          user={user}
          templates={templates}
        />
      </StyledProposal>
    </Sidebar.Pushable>
  );
}
