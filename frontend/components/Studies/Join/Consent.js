import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/dist/client/router";

import { JOIN_STUDY_MUTATION } from "../../Mutations/User";
import { GET_USER_STUDIES } from "../../Queries/User";
import { CREATE_GUEST } from "../../Mutations/Guest";

export default function Consent({ query, user, study }) {
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  console.log({ query });
  console.log({ study });

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

  const [createGuest, { 
    data: guestData, 
    loading: guestLoading, 
    error: guestError 
  }] = useMutation(
    CREATE_GUEST,
    {
      variables: {
        input: {
          participantIn: { 
            connect: { id: study?.id }
          }
        }
      },
    }
  ); 

  async function joinAsUser() {
    await joinStudy();

    // if there is a redirect to the first task
    if (study?.settings?.proceedToFirstTask) {
      router.push({
        pathname: `/participate/run`,
        query: { name: study?.slug },
      });
    } else {
      router.push({
        pathname: `/dashboard/discover/studies`,
        query: { name: study?.slug },
      });
    }
  }

  async function joinAsGuest() {
    const guest = await createGuest();
    const publicId = guest?.data?.createGuest?.publicId;

    if (study?.settings?.proceedToFirstTask) {
      router.push({
        pathname: `/participate/run`,
        query: { name: study?.slug, guest: publicId },
      });
    } else {
      router.push({
        pathname: `/studies/${study?.slug}`,
        query: { guest: publicId },
      });
    }
  }

  function handleJoin() {
    if(query?.guest === "true") {
      joinAsGuest();
    } else {
      joinAsUser();
    }
  }

  // if (!redirected) {
  //   setRedirected(true);
  //   handleJoin();
  // }

  return (
    <div>
      {study?.settings?.consentObtained && study?.consent?.length > 0 &&

        <div>
          <h2>Consent</h2>
        </div>
        
      }
      
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}
