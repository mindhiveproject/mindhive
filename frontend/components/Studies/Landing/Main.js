import { useContext } from "react";
import { useQuery } from "@apollo/client";

import { UserContext } from "../../Global/Authorized";

import { STUDY_TO_DISCOVER } from "../../Queries/Study";
import StudyPage from "./StudyPage";

export default function StudyLandingMain(query) {
  const { slug } = query;
  const user = useContext(UserContext);
  const { data, error, loading } = useQuery(STUDY_TO_DISCOVER, {
    variables: { slug },
  });

  const study = data?.study || {};

  return <StudyPage query={query} user={user} study={study} />;
}
