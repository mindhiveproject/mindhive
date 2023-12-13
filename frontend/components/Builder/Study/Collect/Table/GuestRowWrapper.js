import { useQuery } from "@apollo/client";

import { GET_GUEST_RESULTS } from "../../../../Queries/Result";

import Row from "./Row";

export default function GuestRowWrapper({ studyId, participant, consents }) {
  const { data, loading, error } = useQuery(GET_GUEST_RESULTS, {
    variables: { id: participant?.publicId },
  });

  const guest = data?.guest || {};

  return (
    <Row
      studyId={studyId}
      participant={guest}
      consents={consents}
      type="guest"
    />
  );
}
