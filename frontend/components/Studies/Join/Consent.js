import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";
import { JOIN_STUDY_MUTATION } from "../../Mutations/User";
import { GET_USER_STUDIES } from "../../Queries/User";

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
      refetchQueries: [{ query: GET_USER_STUDIES }],
    }
  );

  async function handleJoin() {
    await joinStudy();
    console.log("Successfuly became a study participant");
    // if there is a redirect to the first task
    if (study?.settings?.proceedToFirstTask) {
      console.log("Redirect to the first task");
      // to do: proceed to the first task
    } else {
      router.push({
        pathname: `/participate/run`,
        query: { id: study?.id },
      });
    }
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
