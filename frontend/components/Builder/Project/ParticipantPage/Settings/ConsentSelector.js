import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_CONSENTS } from "../../../../Queries/Consent";
import { useQuery } from "@apollo/client";

export default function ConsentSelector({ user, study, handleChange }) {
  const { t } = useTranslation("builder");
  const { data, loading, error } = useQuery(GET_CONSENTS);
  const consents = data?.consents || [];
  const options = consents.map((consent) => ({
    key: consent.id,
    text: consent.title,
    value: consent.id,
  }));

  const value = (study && study?.consent?.map((c) => c?.id)) || [];

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "consent",
        value: data.value.map((c) => ({ id: c })),
      },
    });
  };

  return (
    <Dropdown
      placeholder={t('consentSelector.typeConsentProtocol')}
      fluid
      multiple
      search
      selection
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}
