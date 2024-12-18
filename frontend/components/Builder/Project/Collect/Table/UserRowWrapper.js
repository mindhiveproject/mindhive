import { useQuery } from "@apollo/client";

import { GET_USER_RESULTS } from "../../../../Queries/Result";

import Row from "./Row";

export default function UserRowWrapper({ studyId, participant, consents }) {
  const { data, loading, error } = useQuery(GET_USER_RESULTS, {
    variables: { id: participant?.publicId },
  });

  const profile = data?.profile || {};

  return (
    <Row
      studyId={studyId}
      participant={profile}
      consents={consents}
      type="user"
    />
  );
}
