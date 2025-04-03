import { useQuery, useMutation } from "@apollo/client";
import moment from "moment";
import { useState } from "react";
import { GET_PUBLIC_CONSENTS, GET_MY_CONSENTS } from "../../Queries/Consent";
import { CREATE_CONSENT } from "../../Mutations/Consent";
import { useRouter } from "next/router";

import Link from "next/link";
import { customAlphabet } from "nanoid";

export default function ConsentsList({ query, user }) {
  const router = useRouter();
  
  const [newConsentId, setNewConsentId] = useState(null); // State to store the new consent ID
  
  const { data, error, loading } = useQuery(GET_PUBLIC_CONSENTS, {
    variables: {
      id: user?.id,
    },
  });

  const consents = data?.consents || [];
  
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

  const [createNewConsent, {data: newConsentData, errorConsent}] = useMutation(CREATE_CONSENT, {
    refetchQueries: [GET_MY_CONSENTS, "MyConsentQuery"],
  });

  async function createConsentlCopy(i) {
    // console.log("Copying consent...");
    console.log(consents[i])
    const consentToCopy = consents[i];
  
    if (!consentToCopy) {
      console.error("Consent not found.");
      return;
    }

    const input = {
      title: `${consentToCopy.title} (${user.username}'s copy)`, // The title of the consent
      description: consentToCopy.description, // The description of the consent
      info: consentToCopy.info, // The info of the consent
      settings: consentToCopy.settings, // The settings of the consent
      organization: consentToCopy.organization, // The organization of the consent
      code: nanoid(16), // A unique code generated for the consent
      author: {
        connect: {
          id: user?.id, // The ID of the current user, connecting them as the author
        },
      },
      createdAt: new Date().toISOString(), // The timestamp for when the consent is created
    };
    
    // console.log("Consent copy variables:", input);

    try {
      const { data } = await createNewConsent({
        variables: {
          input: input,
        },
      });
  
      // if (data?.createConsent?.id) {
      //   setTimeout(() => {
      //     navigate(`/dashboard/irb/${data.createConsent.id}`);
      //   }, 500);
      // }
      if (data?.createConsent?.id) {
        setNewConsentId(data.createConsent.id); // Store the new consent ID in state
        router.push(`/dashboard/irb/${data.createConsent.id}?action=edit`);
      }
    } catch (error) {
      console.error("Error creating consent copy:", error);
    }
  }
  
  return (
    <div className="board">
      {consents?.map((consent, i) => (
        <Link
          key={i}
          href={{
            pathname: `/dashboard/irb/${newConsentId}?action=edit`,
          }}
        >
          <div className="item">
            <p>{consent?.title}</p>
            <p>{consent?.description}</p>
            <p>{moment(consent?.createdAt).format("MMMM D, YYYY")}</p>
            <button onClick={() => createConsentlCopy(i)}>Customize</button>
          </div>
        </Link>
      ))}
    </div>
  );
}
