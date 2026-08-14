import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { GET_MILESTONES } from "../../../Queries/Milestone";
import { resolveStageFromQuery } from "../../../../lib/feedbackCenterTabs";
import {
  canUserReviewMilestone,
  getFeedbackCenterMilestones,
  getMilestoneByKey,
} from "../../../../lib/milestones";
import { getMilestonesForTemplateBoard } from "../../../../lib/templateBoardActionCards";
import { useBoardMilestones } from "../../../../lib/useBoardMilestones";
import { isOpenForComments } from "../../../../lib/milestoneStatus";

import UserReview from "./UserReview";

// getting the state of the study to review
export default function ReviewBoard({ query, user, reviewType }) {
  const { id } = query;
  const stage = query?.stage;

  const [tab, setTab] = useState(query?.tab || "proposal");

  useEffect(() => {
    async function updateTab() {
      setTab(query?.tab);
    }
    if (query?.tab) {
      updateTab();
    }
  }, [query]);

  const { data } = useQuery(PROPOSAL_REVIEWS_QUERY, {
    variables: {
      id: id,
    },
  });

  const { milestones: boardMilestones } = useBoardMilestones(id);
  const { data: globalMilestonesData } = useQuery(GET_MILESTONES);
  const globalMilestones = globalMilestonesData?.milestones || [];
  const resolvedMilestones = boardMilestones.length
    ? boardMilestones
    : globalMilestones;

  const project = data?.proposalBoard || { sections: [] };
  const permissions = user?.permissions?.map((p) => p?.name) || [];

  const reviewSteps = useMemo(() => {
    const templateBoard = project?.clonedFrom || project;
    return getFeedbackCenterMilestones(
      getMilestonesForTemplateBoard(templateBoard, resolvedMilestones)
    );
  }, [project, resolvedMilestones]);

  const status = stage
    ? resolveStageFromQuery(stage, reviewSteps)
    : reviewSteps[0]?.key || resolveStageFromQuery("proposals", reviewSteps);
  const milestone = getMilestoneByKey(
    status,
    reviewSteps.length ? reviewSteps : resolvedMilestones
  );
  const actionCardType =
    milestone?.actionCardType ||
    (milestone?.scope === "template" ? "ACTION" : "ACTION_SUBMIT");
  const commentsOpen = isOpenForComments(
    project,
    milestone,
    reviewSteps.length ? reviewSteps : resolvedMilestones
  );

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
