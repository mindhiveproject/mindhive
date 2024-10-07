import { useEffect, useState } from "react";
import absoluteUrl from "next-absolute-url";

import { useQuery } from "@apollo/client";

import { STUDY_TO_REVIEW } from "../../../Queries/Study";

import UserReview from "./UserReview";

// getting the state of the study to review
export default function ReviewBoard({ query, user }) {
  const { id } = query;

  const [tab, setTab] = useState(query?.tab || "study");

  useEffect(() => {
    async function updateTab() {
      setTab(query?.tab);
    }
    if (query?.tab) {
      updateTab();
    }
  }, [query]);

  const { data, loading, error } = useQuery(STUDY_TO_REVIEW, {
    variables: {
      id: id,
    },
  });

  const study = data?.study || { proposalMain: { sections: [] } };

  const permissions = user?.permissions?.map((p) => p?.name);
  // Students should be able to view the feedback, but they cannot provide reviews for the proposal page
  const canReview =
    permissions.includes("MENTOR") ||
    permissions.includes("TEACHER") ||
    permissions.includes("SCIENTIST") ||
    study?.status === "IN_REVIEW";

  return (
    <UserReview
      query={query}
      user={user}
      tab={tab}
      study={study}
      canReview={canReview}
    />
  );
}
