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

const DisplayError = ({ error }) => {
  const { t } = useTranslation('common');
  if (!error || !error.message) return null;
  if (
    error.networkError &&
    error.networkError.result &&
    error.networkError.result.errors?.length
  ) {
    return error.networkError.result.errors.map((error, i) => (
      <ErrorStyles key={i}>
        <div className="errorInner">
          <p data-test="graphql-error">
            <strong>{t('error.oops')}</strong>
            {error.message.replace("GraphQL error: ", "")}
          </p>
        </div>
      </ErrorStyles>
    ));
  }
  return (
    <ErrorStyles>
      <div className="errorInner">
        <p data-test="graphql-error">
          <strong>{t('error.oops')}</strong>
          {error.message.replace("GraphQL error: ", "")}
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
