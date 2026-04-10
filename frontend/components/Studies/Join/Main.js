import { useContext } from "react";
import { useQuery } from "@apollo/client";

import { UserContext } from "../../Global/Authorized";

import { STUDY_TO_PARTICIPATE } from "../../Queries/Study";
import FlowWrapper from "./FlowWrapper";

export default function JoinStudyMain(query) {
  const { id, step } = query;
  const user = useContext(UserContext);

  const { data, error, loading } = useQuery(STUDY_TO_PARTICIPATE, {
    variables: { id: id },
  });

  const study = data?.study || {};

  console.log({ study });

  return <FlowWrapper user={user} study={study} step={step} query={query} />;
}
