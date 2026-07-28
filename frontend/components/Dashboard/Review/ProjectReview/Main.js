import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { GET_MILESTONES } from "../../../Queries/Milestone";
import {
  buildFeedbackCenterTabs,
  resolveStageFromQuery,
} from "../../../../lib/feedbackCenterTabs";
import {
  canUserReviewMilestone,
  getMilestoneByKey,
} from "../../../../lib/milestones";
import { useBoardMilestones } from "../../../../lib/useBoardMilestones";
import { isOpenForComments } from "../../../../lib/milestoneStatus";

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

  const { milestones: boardMilestones } = useBoardMilestones(id);
  const { data: globalMilestonesData } = useQuery(GET_MILESTONES);
  const globalMilestones = globalMilestonesData?.milestones || [];
  const milestones = boardMilestones.length ? boardMilestones : globalMilestones;

  const project = data?.proposalBoard || { sections: [] };
  const permissions = user?.permissions?.map((p) => p?.name) || [];

  const status = resolveStageFromQuery(stage, milestones);
  const milestone = getMilestoneByKey(status, milestones);
  const actionCardType =
    milestone?.actionCardType ||
    (milestone?.scope === "template" ? "ACTION" : "ACTION_SUBMIT");
  const commentsOpen = isOpenForComments(project, milestone, milestones);

  const canReview = canUserReviewMilestone(
    permissions,
    milestone,
    commentsOpen
  );

  return (
    <UserReview
      query={query}
      user={user}
      tab={tab}
      project={project}
      status={status}
      actionCardType={actionCardType}
      canReview={canReview}
      milestone={milestone}
    />
  );
}
