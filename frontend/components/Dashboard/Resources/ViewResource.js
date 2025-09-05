import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";

import { GET_RESOURCE } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";

export default function ViewResource({ query, user, goBack }) {
  const { id } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading resource.</p>;

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" /> Go Back
      </button>
      <h1>{resource?.title}</h1>
      <p>{resource?.description}</p>
      <div>{ReactHtmlParser(resource?.content?.main)}</div>
    </StyledResource>
  );
}
