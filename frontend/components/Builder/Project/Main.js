import Router from "./Router";

import { Menu, Sidebar } from "semantic-ui-react";
import { useState } from "react";
import ChatPage from "../../Dashboard/Chat/ChatPage";

import StyledSlidebar from "../../styles/StyledSlidebar";
import { StyledChat } from "../../styles/StyledChat";
import StyledProject from "../../styles/StyledProject";

export default function StudyBuilder({ query, user }) {
  const { area, selector } = query;
  const tab = query?.tab || "board";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatId, setChatId] = useState(undefined);

  const toggleSidebar = ({ chatId }) => {
    setChatId(chatId);
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <StyledSlidebar>
        <Sidebar
          animation="overlay"
          icon="labeled"
          vertical="true"
          visible={sidebarOpen}
          direction="right"
          width="very wide"
        >
          <div className="chat">
            <div className="closeBtn" onClick={() => setSidebarOpen(false)}>
              <span>&times;</span>
            </div>
            <StyledChat>
              {chatId && (
                <ChatPage
                  code={chatId}
                  user={user}
                  query={query}
                  studyid={selector}
                />
              )}
            </StyledChat>
          </div>
        </Sidebar>
      </StyledSlidebar>

      <Sidebar.Pusher>
        <StyledProject>
          <Router
            query={query}
            user={user}
            tab={tab}
            toggleSidebar={toggleSidebar}
          />
        </StyledProject>
      </Sidebar.Pusher>
    </>
  );
}
