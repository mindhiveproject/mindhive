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

  // use user or guest depending on the query. Both contexts are read
  // unconditionally — calling useContext inside a branch changes the hook
  // order between renders.
  const { user: authUser } = useContext(UserContext);
  const guestUser = useContext(GuestContext);
  const user = guestPublicId ? guestUser : authUser;

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
