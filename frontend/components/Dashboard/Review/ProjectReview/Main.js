import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

import UserReview from "./UserReview";

// getting the state of the study to review
export default function ReviewBoard({ query, user, reviewType }) {
  const { id } = query;
  const stage = query?.stage || "proposals";

  const [tab, setTab] = useState(query?.tab || "proposal");

  useEffect(() => {
    async function updateTab() {
      setTab(query?.tab);
    }
    if (query?.tab) {
      updateTab();
    }
  }, [query]);

  const { data, loading, error } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: id,
    },
  });

  const project = data?.proposalBoard || { sections: [] };
  const permissions = user?.permissions?.map((p) => p?.name);

  // Check whether the proposal is open for comments at this stage
  let status, actionCardType, isOpenForCommentsQuery;
  switch (stage) {
    case "proposals":
      status = "SUBMITTED_AS_PROPOSAL";
      (actionCardType = "ACTION_SUBMIT"),
        (isOpenForCommentsQuery = "submitProposalOpenForComments");
      break;
    case "inreview":
      status = "PEER_REVIEW";
      actionCardType = "ACTION_PEER_FEEDBACK";
      isOpenForCommentsQuery = "peerFeedbackOpenForComments";
      break;
    case "report":
      status = "PROJECT_REPORT";
      actionCardType = "ACTION_PROJECT_REPORT";
      isOpenForCommentsQuery = "projectReportOpenForComments";
      break;
    default:
      status = "SUBMITTED_AS_PROPOSAL";
      actionCardType = "ACTION_SUBMIT";
      isOpenForCommentsQuery = "submitProposalOpenForComments";
  }
  const isOpenForComments = project[isOpenForCommentsQuery];

  // Students should be able to view the feedback, but they cannot provide reviews for the proposal page (but only at the peer review stage)
  const canReview =
    (permissions.includes("MENTOR") ||
      permissions.includes("TEACHER") ||
      permissions.includes("SCIENTIST") ||
      status === "PEER_REVIEW") &&
    isOpenForComments;

  return (
    <UserReview
      query={query}
      user={user}
      tab={tab}
      project={project}
      status={status}
      actionCardType={actionCardType}
      canReview={canReview}
    />
  );
}
