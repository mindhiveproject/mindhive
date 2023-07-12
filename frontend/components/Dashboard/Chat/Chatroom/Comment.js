import { useState } from "react";

import moment from "moment";
import ReactHtmlParser from "react-html-parser";
import { Accordion, Icon, Label } from "semantic-ui-react";

import Update from "./Update";
import Delete from "./Delete";
import NewMessage from "./NewMessage";
import { useQuery } from "@apollo/client";
import { GET_MESSAGE } from "../../../Queries/Chat";

export default function Comment({ user, message, chat, membersIds }) {
  const { data, loading, error } = useQuery(GET_MESSAGE, {
    variables: { id: message?.id },
  });
  const comment = data?.word || {};

  const isMessageAuthor = comment?.author?.id === user?.id;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  return (
    <div className="comment">
      <div className="header">
        <div className="nameDate">
          <div>
            <div>
              <span>{comment?.author?.username} </span>
              <span className="date">
                | {moment(comment?.createdAt).format("MMMM Do YYYY, h:mm a")}
              </span>
            </div>
            {comment?.updatedAt &&
              comment?.updatedAt !== comment?.createdAt && (
                <div className="date">
                  Edited on:{" "}
                  {moment(comment?.updatedAt).format("MMMM Do YYYY, h:mm a")}
                </div>
              )}
          </div>
          <div className="editLinks">
            {isMessageAuthor && (
              <Update chatId={chat?.id} btnName="Update" oldMessage={comment} />
            )}

            {(isMessageAuthor ||
              user?.permissions.includes("ADMIN") ||
              user?.permissions.includes("TEACHER")) && (
              <Delete chatId={chat?.id} messageId={comment?.id} />
            )}
          </div>
        </div>
        <div className="title">{comment?.settings?.title}</div>
      </div>
      <div className="content">{ReactHtmlParser(comment?.message)}</div>

      <div className="comments">
        <div className="content">
          {comment?.children?.length > 0 && (
            <Accordion fluid>
              <Accordion.Title
                active={activeIndex === 0}
                index={0}
                onClick={handleClick}
              >
                <Icon name="dropdown" />
                <Label color="teal" size="large">
                  {comment?.children?.length}{" "}
                  {comment?.children?.length > 1 ? "replies" : "reply"}
                </Label>
              </Accordion.Title>
              <Accordion.Content active={activeIndex === 0}>
                {comment.children.map((comment, num) => (
                  <Comment
                    key={num}
                    userId={user?.id}
                    chat={chat}
                    message={comment}
                  />
                ))}
              </Accordion.Content>
            </Accordion>
          )}
        </div>

        <div className="replyBtn">
          <NewMessage
            chat={chat}
            parentMessageId={comment?.id}
            btnName="Reply"
            membersIds={membersIds}
          />
        </div>
      </div>
    </div>
  );
}
