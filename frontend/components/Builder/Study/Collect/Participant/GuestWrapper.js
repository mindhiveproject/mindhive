import { useQuery } from "@apollo/client";
import { GET_GUEST_PARTICIPANT } from "../../../../Queries/User";

import ParticipantInformation from "./Information";

export default function UserWrapper({ study, publicId, type }) {
  const { data } = useQuery(GET_GUEST_PARTICIPANT, {
    variables: { publicId },
  });

  const participant = data?.guest || {};

  return (
    <ParticipantInformation
      participant={participant}
      study={study}
      type={type}
    />
  );
}
