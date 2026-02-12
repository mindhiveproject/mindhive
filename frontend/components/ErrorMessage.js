import styled from "styled-components";
import React from "react";
import useTranslation from "next-translate/useTranslation";

import PropTypes from "prop-types";

const ErrorStyles = styled.div`
  display: grid;
  max-width: var(--maxWidth);
  width: 100%;
  justify-self: center;
  .errorInner {
    padding: 2rem;
    background: white;
    margin: 2rem 0;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-left: 5px solid var(--red);
    p {
      margin: 0;
      font-weight: 100;
    }
    strong {
      margin-right: 1rem;
    }
  }
`;

function getDisplayMessage(rawMessage, t) {
  if (!rawMessage) return "";
  const stripped = rawMessage.replace(/^GraphQL error: \s*/i, "");
  const isEmailUniqueConstraint =
    /unique constraint failed/i.test(stripped) && /email/i.test(stripped);
  return isEmailUniqueConstraint ? t("error.emailAlreadyInUse") : stripped;
}

const DisplayError = ({ error }) => {
  const { t } = useTranslation("common");
  if (!error || !error.message) return null;
  if (
    error.networkError &&
    error.networkError.result &&
    error.networkError.result.errors?.length
  ) {
    return error.networkError.result.errors.map((err, i) => (
      <ErrorStyles key={i}>
        <div className="errorInner">
          <p data-test="graphql-error">
            <strong>{t("error.oops")}</strong>
            {getDisplayMessage(err.message, t)}
          </p>
        </div>
      </ErrorStyles>
    ));
  }
  return (
    <ErrorStyles>
      <div className="errorInner">
        <p data-test="graphql-error">
          <strong>{t("error.oops")}</strong>
          {getDisplayMessage(error.message, t)}
        </p>
      </div>
    </ErrorStyles>
  );
};

DisplayError.defaultProps = {
  error: {},
};

DisplayError.propTypes = {
  error: PropTypes.object,
};

export default DisplayError;
