import { useMutation } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";
import { Icon } from "semantic-ui-react";

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
      <div className="updateIcon">
        <img src="/assets/icons/bell.svg" alt="bell" />
      </div>
      <div className="updateContent">
        <div className="title">{ReactHtmlParser(update?.content?.title)}</div>
        <div className="message">
          {ReactHtmlParser(update?.content?.message)}
        </div>
        {/* <div className="contextInfo">{moment(update.createdAt).fromNow()}</div> */}
        <Link href={`${update.link}`} as={`${update.link}`} target="_blank">
          <div className="linkTitle" onClick={() => openUpdate()}>
            {update?.content?.linkTitle
              ? ReactHtmlParser(update?.content?.linkTitle)
              : "Open"}
          </div>
        </Link>
      </div>
      <div className="updateDelete" onClick={() => deleteUpdate()}>
        <img src="/assets/icons/close.svg" alt="close" />
      </div>
    </StyledUpdateCard>
  );
}
