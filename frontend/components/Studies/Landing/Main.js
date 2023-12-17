import { useContext } from "react";
import { useQuery } from "@apollo/client";

import { UserContext } from "../../Global/Authorized";
import { GuestContext } from "../../Global/GuestContext";

import { STUDY_TO_DISCOVER } from "../../Queries/Study";
import StudyPage from "./StudyPage";
import RunStudy from "../Run/Main";

export default function StudyLandingMain({ query, isDashboard, isRun }) {
  const { name, task, version } = query;
  const guestPublicId = query?.guest;

  const { data, error, loading } = useQuery(STUDY_TO_DISCOVER, {
    variables: { slug: name },
  });

  const study = data?.study || {};

  let user;
  // use user or guest depending on the query
  if (guestPublicId) {
    user = useContext(GuestContext);
  } else {
    user = useContext(UserContext);
  }

  if (isRun && user && study) {
    return <RunStudy user={user} study={study} task={task} version={version} />;
  }

  if (!isRun) {
    return (
      <StudyPage
        query={query}
        user={user}
        study={study}
        isDashboard={isDashboard}
      />
    );
  }
}
