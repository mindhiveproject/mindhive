import { useQuery } from "@apollo/client";
import { GET_MY_CHATS } from "../../Queries/Chat";
import moment from "moment";

import Link from "next/link";
import StyledZeroState from "../../styles/StyledZeroState";

export default function ChatsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_MY_CHATS, {
    variables: {
      id: user?.id,
    },
  });

  const chats = data?.talks || [];

  if (chats.length === 0) {
    return (
      <StyledZeroState>
        <div className="message">
          <h3>You haven’t created any group chats yet.</h3>
          <p>Once you create a group chat, it will appear here.</p>
        </div>
      </StyledZeroState>
    );
  }

  return (
    <>
      <div className="chatsHeader">
        <div>Name</div>
        <div>Classes / Studies / Members</div>
        <div>Date created</div>
      </div>

      <div className="board">
        {chats?.map((chat, i) => (
          <div key={i} className="wrapper">
            <Link
              href={{
                pathname: `/dashboard/chats/${chat?.id}`,
              }}
            >
              <div key={i} className="chatRow">
                <p>{chat?.settings?.title}</p>
                <div className="members">
                  {chat?.classes.length > 0 && (
                    <div>
                      <span className="title">Classes</span>
                      {chat?.classes?.map((theClass, num) => (
                        <span className="item" key={num}>
                          {theClass?.title} 
                        </span>
                      ))}
                    </div>
                  )}

                  {chat?.studies.length > 0 && (
                    <div>
                      <span className="title">Studies</span>
                      {chat?.studies?.map((study, num) => (
                        <span className="item" key={num}>
                          {study?.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {chat?.members.length > 0 && (
                    <div>
                      <span className="title">Members</span>
                      {chat?.members?.map((member, num) => (
                        <span className="item" key={num}>
                          {member?.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p>{moment(chat?.createdAt).format("MMMM D, YYYY")}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
