import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import useForm from "../../../../lib/useForm";

import JoinStudy from "../JoinStudy";
import ConsentForm from "./Form";

export default function Consents({ query, user, study }) {
  const router = useRouter();

  const { inputs, handleChange } = useForm({
    ...query,
  });

  const [consentId, setConsentId] = useState(query?.consent || null);

  const { settings } = study;
  const consents = study?.consent || [];
  const [currentConsent] = consents?.filter((con) => con.id === consentId);

  const currentPosition = consents?.map((con) => con?.id).indexOf(consentId);

  const isItTheLastConsent = !consents[currentPosition + 1];
  let nextConsentId;
  if (!isItTheLastConsent) {
    nextConsentId = consents[currentPosition + 1].id;
  }

  useEffect(() => {
    // Function to handle change of consent id via a query
    const handleRefresh = () => {
      setConsentId(query?.consent);
    };
    handleRefresh();
  }, [query]);

  return (
    <div>
      <ConsentForm
        consent={currentConsent}
        settings={settings}
        userInfo={query}
        inputs={inputs}
        handleChange={handleChange}
      />

      {!isItTheLastConsent && (
        <Link
          href={{
            pathname: `/join/consent`,
            query: {
              ...inputs,
              id: study?.id,
              consent: nextConsentId,
              [`consent-${consentId}`]: `agree`,
            },
          }}
        >
          <button>I agree, next</button>
        </Link>
      )}

      {!isItTheLastConsent && (
        <Link
          href={{
            pathname: `/join/consent-skipped`,
            query: {
              studyId: study?.id,
            },
          }}
        >
          <button>Skip consent</button>
        </Link>
      )}

      {isItTheLastConsent && (
        <JoinStudy
          user={user}
          study={study}
          userInfo={{
            ...inputs,
            [`consent-${consentId}`]: `agree`,
          }}
          btnName="I agree, join the study"
        />
      )}

      {isItTheLastConsent && (
        <Link
          href={{
            pathname: `/join/consent-skipped`,
            query: {
              studyId: study?.id,
            },
          }}
        >
          <button>Skip consent</button>
        </Link>
      )}
    </div>
  );
}
