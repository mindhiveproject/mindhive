import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import { GET_ALL_HOMEWORK_FOR_PROPOSAL_CARD } from "../../../../../../Queries/Homework";
import { Dropdown } from "semantic-ui-react";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Homework from "./Homework";
import Navigation from "../../../../Navigation/Main";
import { StyledProposal } from "../../../../../../styles/StyledProposal";

export default function OverviewOfIndividualCards({
  query,
  tab,
  user,
  proposalId,
  proposalCard,
  cardId,
  closeCard,
  isPreview,
}) {
  const { t } = useTranslation("builder");
  const [homeworkId, setHomeworkId] = useState(null);

  const { data, loading, error } = useQuery(
    GET_ALL_HOMEWORK_FOR_PROPOSAL_CARD,
    {
      variables: {
        cardId: proposalCard?.id,
      },
    }
  );
  const homeworks = data?.homeworks || [];

  const studentFilterOptions = homeworks.map((homework) => ({
    key: homework?.id,
    text: homework?.author?.username,
    value: homework?.id,
  }));

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={() => {}}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={() => {}}
        saveBtnName={t("overviewCard.close", "Close")}
      />

      <StyledProposal>
        <div className="post">
          <div className="proposalCardBoard">
            <div className="textBoard">
              <div className="cardHeader">{proposalCard?.title}</div>
              <div className="cardDescription">
                {ReactHtmlParser(proposalCard?.description)}
              </div>

              <Dropdown
                placeholder={t("overviewCard.selectStudent", "Select student")}
                fluid
                selection
                options={studentFilterOptions}
                onChange={(event, data) => setHomeworkId(data?.value)}
                value={homeworkId}
              />

              {homeworkId && <Homework homeworkId={homeworkId} />}
            </div>
          </div>
        </div>
      </StyledProposal>
    </>
  );
}
