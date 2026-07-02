import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { Sidebar } from "semantic-ui-react";

import InDev from "../../../Global/InDev";
import Button from "../../../DesignSystem/Button";
import JustOneSecondNotice from "../../../DesignSystem/JustOneSecondNotice";
import { PROPOSAL_TEMPLATES_QUERY } from "../../../Queries/Proposal";
import CreateProposal from "./ProjectBoard/Create";

export default function ProjectsBoardCreate({ myclass, query }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const { data, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);
  const templates = data?.proposalBoards || [];

  const projectsHref = {
    pathname: `/dashboard/myclasses/${myclass?.code}`,
    query: { page: "projects" },
  };

  const onBack = () => {
    router.push(projectsHref);
  };

  const backBar = (
    <div className="projectsBoardBackBar">
      <Button variant="outline" type="button" onClick={onBack}>
        ← {t("projects.backToClass", {}, { default: "Back to class" })}
      </Button>
    </div>
  );

  if (loading && !data) {
    return (
      <>
        {backBar}
        <JustOneSecondNotice
          message={{
            h1: t("projectBoard.loading", {}, { default: "Loading project board..." }),
            p: t("projectBoard.selectProjectTemplate", {}, {
              default: "Select project template",
            }),
          }}
        />
      </>
    );
  }

  if (templates.length === 0) {
    return (
      <>
        {backBar}
        <InDev
          header={t("projectBoard.noTemplatesHeader")}
          message={t("projectBoard.noTemplatesMessage")}
        />
      </>
    );
  }

  return (
    <Sidebar.Pushable style={{ overflowY: "hidden" }}>
      {backBar}
      <CreateProposal
        myclass={myclass}
        templates={templates}
        isCopy={false}
        onBack={onBack}
        initialTemplateId={query?.template || null}
      />
    </Sidebar.Pushable>
  );
}
