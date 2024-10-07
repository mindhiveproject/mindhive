import { useState } from "react";
import { Menu } from "semantic-ui-react";

import Comment from "./Comment";

const tabs = [
  {
    value: "proposal",
    name: "Proposal Feedback",
    stage: "SUBMITTED_AS_PROPOSAL",
  },
  {
    value: "study",
    name: "Study Feedback",
    stage: "IN_REVIEW",
  },
];

export default function Feedback({ query, study, selectReview }) {
  const [feedbackTab, setFeedbackTab] = useState("proposal");

  const feedbackType =
    feedbackTab === "study" ? "IN_REVIEW" : "SUBMITTED_AS_PROPOSAL";

  return (
    <div className="descriptionMenu">
      <Menu tabular stackable>
        {tabs.map((tab, i) => (
          <div key={i}>
            <Menu.Item
              key={i}
              name={tab.name}
              active={feedbackTab === tab.value}
              onClick={() => setFeedbackTab(tab.value)}
            >
              <div>
                {tab.name} (
                {
                  study?.reviews?.filter(
                    (review) => review?.stage === tab?.stage
                  ).length
                }
                )
              </div>
            </Menu.Item>
          </div>
        ))}
      </Menu>

      <div>
        {study?.reviews &&
        study?.reviews.filter((review) => review.stage === feedbackType)
          .length ? (
          <div className="reviewsCards">
            {study?.reviews
              .filter((review) => review.stage === feedbackType)
              .sort((a, b) => {
                return b?.upvotedBy?.length - a?.upvotedBy?.length;
              })
              .map((review, num) => (
                <Comment key={num} number={num + 1} review={review} />
              ))}
          </div>
        ) : (
          <div className="reviewsPlaceholder">
            <p>
              <strong>You don’t have any reviews yet</strong>
            </p>
            <p>Reviews will appear here once you submit</p>
          </div>
        )}
      </div>
    </div>
  );
}
