import { useContext } from "react";
import { useQuery } from "@apollo/client";

import { UserContext } from "../../Global/Authorized";

import { STUDY_TO_JOIN } from "../../Queries/Study";
import FlowWrapper from "./FlowWrapper";
import RunStudy from "../Run/Main";

export default function JoinStudyMain(query) {
  const { id, step } = query;
  const user = useContext(UserContext);

  const { data, error, loading } = useQuery(STUDY_TO_JOIN, {
    variables: { id },
  });

  const study = data?.study || {};

  if (step === "run") {
    return <RunStudy user={user} study={study} />;
  }

  return <FlowWrapper user={user} study={study} step={step} query={query} />;
}
