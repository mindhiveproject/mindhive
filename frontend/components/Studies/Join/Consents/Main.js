import { useState, useEffect } from "react";
import Link from "next/link";

import useForm from "../../../../lib/useForm";

import JoinStudy from "../JoinStudy";
import ConsentForm from "./Form";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../DesignSystem/Button";
import { StyledConsent } from "../../../styles/StyledJoinStudyFlow";

export default function Consents({ query, user, study }) {
  const { t } = useTranslation("common");

  const { inputs, handleChange } = useForm({
    ...query,
  });

  const [consentId, setConsentId] = useState(query?.consent || null);

  const consents = study?.consent || [];
  const [currentConsent] = consents?.filter((con) => con.id === consentId);

  const currentPosition = consents?.map((con) => con?.id).indexOf(consentId);

  const isItTheLastConsent = !consents[currentPosition + 1];
  let nextConsentId;
  if (!isItTheLastConsent) {
    nextConsentId = consents[currentPosition + 1].id;
  }

  useEffect(() => {
    setConsentId(query?.consent);
  }, [query]);

  const skipHref = {
    pathname: `/join/consent-skipped`,
    query: {
      id: study?.id,
      studyId: study?.id,
    },
  };

  return (
    <StyledConsent>
      <ConsentForm
        consent={currentConsent}
        userInfo={query}
        inputs={inputs}
        handleChange={handleChange}
      />

      <div className="actions">
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
            <Button variant="filled">
              {t("consent.form.iAgreeNext", {}, { default: "I agree, next" })}
            </Button>
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
            btnName={t("consent.form.iAgreeJoin", {}, {
              default: "I agree, join the study",
            })}
          />
        )}

        <Link href={skipHref}>
          <Button variant="outline">
            {t("consent.form.skip", {}, { default: "Skip consent" })}
          </Button>
        </Link>
      </div>
    </StyledConsent>
  );
}
