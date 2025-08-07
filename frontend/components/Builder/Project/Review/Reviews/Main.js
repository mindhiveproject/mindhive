import { useState } from "react";
import { Menu } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Feedback from "../../../../Dashboard/Review/Feedback/Main";

export default function FeedbackTabs({ user, query, proposal, selectReview }) {
  const { t } = useTranslation("builder");
  const tabs = [
    {
      value: "proposal",
      name: t("reviewTabs.proposalFeedback", "Proposal Feedback"),
      id: "proposalFeedback",
      stage: "SUBMITTED_AS_PROPOSAL",
    },
    {
      value: "peer",
      name: t("reviewTabs.peerFeedback", "Peer Feedback"),
      id: "peerFeedback",
      stage: "PEER_REVIEW",
    },
    {
      value: "report",
      name: t("reviewTabs.projectReportFeedback", "Project Report Feedback"),
      id: "projectReportFeedback",
      stage: "PROJECT_REPORT",
    },
  ];
  const [feedbackTab, setFeedbackTab] = useState("SUBMITTED_AS_PROPOSAL");

  return (
    <div className="descriptionMenu">
      <Menu tabular stackable>
        {tabs.map((tab, i) => (
          <div key={i}>
            <Menu.Item
              key={i}
              name={tab.name}
              id={tab.id}
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
