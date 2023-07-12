import { useState } from "react";

import moment from "moment";
import ReactHtmlParser from "react-html-parser";
import { Accordion, Icon, Label } from "semantic-ui-react";

import Update from "./Update";
import Delete from "./Delete";
import NewMessage from "./NewMessage";
import Comment from "./Comment";

export default function Message({ user, message, chat, membersIds }) {
  const isMessageAuthor = message?.author?.id === user?.id;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  return (
    <div className="message">
      <div className="header">
        <div className="nameDate">
          <div>
            <div>
              <span>{message?.author?.username} </span>
              <span className="date">
                | {moment(message?.createdAt).format("MMMM Do YYYY, h:mm a")}
              </span>
            </div>
            {message?.updatedAt &&
              message?.updatedAt !== message?.createdAt && (
                <div className="date">
                  Edited on:{" "}
                  {moment(message?.updatedAt).format("MMMM Do YYYY, h:mm a")}
                </div>
              )}
          </div>
          <div className="editLinks">
            {isMessageAuthor && (
              <Update chatId={chat?.id} btnName="Update" oldMessage={message} />
            )}

            {(isMessageAuthor ||
              user?.permissions.includes("ADMIN") ||
              user?.permissions.includes("TEACHER")) && (
              <Delete chatId={chat?.id} messageId={message?.id} />
            )}
          </div>
        </div>
        <div className="title">{message?.settings?.title}</div>
      </div>
      <div className="content">{ReactHtmlParser(message?.message)}</div>

      <div className="comments">
        <div className="content">
          {message?.children?.length > 0 && (
            <Accordion fluid>
              <Accordion.Title
                active={activeIndex === 0}
                index={0}
                onClick={handleClick}
              >
                <Icon name="dropdown" />
                <Label color="teal" size="large">
                  {message?.children?.length}{" "}
                  {message?.children?.length > 1 ? "replies" : "reply"}
                </Label>
              </Accordion.Title>
              <Accordion.Content active={activeIndex === 0}>
                {message.children.map((comment, num) => (
                  <Comment
                    key={num}
                    user={user}
                    message={comment}
                    chat={chat}
                    membersIds={membersIds}
                  />
                ))}
              </Accordion.Content>
            </Accordion>
          )}
        </div>

        <div className="replyBtn">
          <NewMessage
            chat={chat}
            parentMessageId={message?.id}
            btnName="Reply"
            membersIds={membersIds}
          />
        </div>
      </div>
    </div>
  );
}
