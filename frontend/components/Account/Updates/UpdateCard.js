import { useMutation } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";

import { StyledUpdateCard } from "../../styles/StyledUpdateCard";

import { OPEN_UPDATE, DELETE_UPDATE } from "../../Mutations/Update";
import { GET_MY_UPDATES, COUNT_NEW_UPDATES } from "../../Queries/Update";

export default function UpdateCard({ user, update }) {
  const [openUpdate, { loading: loadingOpen }] = useMutation(OPEN_UPDATE, {
    variables: { id: update?.id },
    refetchQueries: [
      {
        query: GET_MY_UPDATES,
        variables: { id: user?.id },
      },
      { query: COUNT_NEW_UPDATES, variables: { id: user?.id } },
    ],
  });

  const [deleteUpdate, { loading }] = useMutation(DELETE_UPDATE, {
    variables: { id: update?.id },
    refetchQueries: [
      {
        query: GET_MY_UPDATES,
        variables: { id: user?.id },
      },
    ],
  });

  return (
    <StyledUpdateCard>
      <div className="infoMessage">
        <div>{ReactHtmlParser(update?.content?.message)}</div>
        <div className="contextInfo">{moment(update.createdAt).fromNow()}</div>
      </div>
      <div className="linkMessage">
        <div onClick={() => openUpdate()}>
          <Link href={`${update.link}`} as={`${update.link}`} target="_blank">
            <p>Open</p>
          </Link>
        </div>
      </div>
      <div className="deleteButton" onClick={() => deleteUpdate()}>
        &times;
      </div>
    </StyledUpdateCard>
  );
}
