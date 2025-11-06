import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Icon } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";
import { GET_RESOURCE } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";

export default function ViewResource({ query, user, goBack }) {
  const { id } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};
  const { t } = useTranslation("classes");
  if (loading) return <p>{t("boardManagement.loadingDotdotdot")}</p>;
  if (error) return <p>{t("boardManagement.errorLoadingResources")}</p>;

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" /> {t("boardManagement.goBackToResourceArea")}
      </button>
      <h1>{resource?.title}</h1>
      <p>{resource?.description}</p>
      <div>{ReactHtmlParser(resource?.content?.main)}</div>
    </StyledResource>
  );
}
