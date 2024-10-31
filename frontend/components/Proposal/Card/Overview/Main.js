import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import { GET_ALL_HOMEWORK_FOR_PROPOSAL_CARD } from "../../../Queries/Homework";
import { Dropdown } from "semantic-ui-react";
import { useState } from "react";

import Homework from "./Homework";

export default function OverviewOfIndividualCards({
  user,
  proposalCard,
  closeCard,
  isPreview,
}) {
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
    <div className="post">
      <div className="proposalCardBoard">
        <div className="textBoard">
          <div className="cardHeader">{proposalCard?.title}</div>
          <div className="cardDescription">
            {ReactHtmlParser(proposalCard?.description)}
          </div>

          <Dropdown
            placeholder="Select student"
            fluid
            selection
            options={studentFilterOptions}
            onChange={(event, data) => setHomeworkId(data?.value)}
            value={homeworkId}
          />

          <Homework homeworkId={homeworkId} />
        </div>
      </div>
    </div>
  );
}
