import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

import UserReview from "./UserReview";

// getting the state of the study to review
export default function ReviewBoard({ query, user, reviewType }) {
  const { id } = query;

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

  // Students should be able to view the feedback, but they cannot provide reviews for the proposal page (but only at the peer review stage)
  const canReview =
    permissions.includes("MENTOR") ||
    permissions.includes("TEACHER") ||
    permissions.includes("SCIENTIST") ||
    reviewType === "PEER_REVIEW";

  return (
    <UserReview
      query={query}
      user={user}
      tab={tab}
      project={project}
      canReview={canReview}
    />
  );
}
