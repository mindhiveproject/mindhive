import { useState } from "react";
import { Menu } from "semantic-ui-react";

import Feedback from "../../../../Dashboard/Review/Feedback/Main";

const tabs = [
  {
    value: "proposal",
    name: "Proposal Feedback",
    stage: "SUBMITTED_AS_PROPOSAL",
  },
  {
    value: "peer",
    name: "Peer Feedback",
    stage: "PEER_REVIEW",
  },
  {
    value: "report",
    name: "Project Report Feedback",
    stage: "PROJECT_REPORT",
  },
];

export default function FeedbackTabs({ user, query, proposal, selectReview }) {
  const [feedbackTab, setFeedbackTab] = useState("SUBMITTED_AS_PROPOSAL");

  return (
    <div className="descriptionMenu">
      <Menu tabular stackable>
        {tabs.map((tab, i) => (
          <div key={i}>
            <Menu.Item
              key={i}
              name={tab.name}
              active={feedbackTab === tab.stage}
              onClick={() => setFeedbackTab(tab.stage)}
            >
              <div>
                {tab.name} (
                {
                  proposal?.reviews?.filter(
                    (review) => review?.stage === tab?.stage
                  ).length
                }
                )
              </div>
            </Menu.Item>
          </div>
        ))}
      </Menu>

      <Feedback
        user={user}
        projectId={proposal?.id}
        status={feedbackTab}
        reviews={
          proposal?.reviews?.filter((review) => review.stage === feedbackTab) ||
          []
        }
      />
    </div>
  );
}
