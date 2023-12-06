import { useQuery } from "@apollo/client";
import { GET_USER_PARTICIPANT } from "../../../../Queries/User";

import ParticipantInformation from "./Information";

export default function UserWrapper({ study, publicId, type }) {
  const { data } = useQuery(GET_USER_PARTICIPANT, {
    variables: { publicId },
  });

  const participant = data?.profile || {};

  return (
    <ParticipantInformation
      participant={participant}
      study={study}
      type={type}
    />
  );
}
