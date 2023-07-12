import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import { JOIN_STUDY_MUTATION } from "../../Mutations/User";

export default function Consent({ query, user, study }) {
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  const [joinStudy, { data, loading, error }] = useMutation(
    JOIN_STUDY_MUTATION,
    {
      variables: {
        id: user?.id,
        studyId: study?.id,
      },
    }
  );

  async function handleJoin() {
    await joinStudy();
    console.log("Success!");
    router.push({
      pathname: "/studies/" + study?.slug,
    });
  }

  // if (!redirected) {
  //   setRedirected(true);
  //   handleJoin();
  // }

  return (
    <div>
      <h2>Consent</h2>
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}
