import { useState } from "react";
import { Sidebar } from "semantic-ui-react";
import ChatPage from "../Dashboard/Chat/ChatPage";
import StyledSlidebar from "../styles/StyledSlidebar";
import { StyledChat } from "../styles/StyledChat";
import StyledProject from "../styles/StyledProject";
import { StyledBuilderArea } from "../styles/StyledBuilder";
import TabRouter from "./TabRouter";
import { defaultBuilderTab, getBuilderMode } from "./shared/identity";

export default function BuilderApp({ query, user }) {
  const { area, selector } = query;
  const mode = getBuilderMode(area);
  const tab = query?.tab || defaultBuilderTab(area);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatId, setChatId] = useState(undefined);
  const [chatStudyId, setChatStudyId] = useState(undefined);

  const toggleSidebar = ({ chatId: nextChatId, studyId } = {}) => {
    setChatId(nextChatId);
    if (studyId) setChatStudyId(studyId);
    setSidebarOpen((open) => !open);
  };

  const Frame = mode === "project" ? StyledProject : StyledBuilderArea;
  const studyid = chatStudyId || (mode === "project" ? undefined : selector);

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
                  studyid={studyid}
                />
              )}
            </StyledChat>
          </div>
        </Sidebar>
      </StyledSlidebar>

      <Sidebar.Pusher>
        <Frame>
          <TabRouter
            query={query}
            user={user}
            tab={tab}
            toggleSidebar={toggleSidebar}
          />
        </Frame>
      </Sidebar.Pusher>
    </>
  );
}
