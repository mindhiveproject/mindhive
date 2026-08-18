import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import ReactHtmlParser from "react-html-parser";

import { GET_RESOURCE } from "../../../../Queries/Resource";
import StyledResource from "../../../../styles/StyledResource";
import { stripHtml } from "../../../../Proposal/Card/Forms/utils";
import Button from "../../../../DesignSystem/Button";

const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

export default function ViewResource({ resourceId, myclass, user, query }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id: resourceId },
    skip: !resourceId,
  });
  const resource = data?.resource || {};

  const goBack = () => {
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "resources" },
    });
  };

  if (!resourceId) return <p>{t("resource.notFound", "Resource not found.")}</p>;
  if (loading) return <p>{t("common.loading", "Loading…")}</p>;
  if (error) return <p>{t("resource.errorLoading", "Error loading resource.")}</p>;

  return (
    <StyledResource>
      <TopSection>
        <Button variant="outline" type="button" onClick={goBack}>
          {t("resource.goBackToResources", {}, { default: "Back to class resources" })}
        </Button>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "resources", action: "edit", resource: resourceId },
          }}
          style={{ textDecoration: "none" }}
        >
          <Button variant="filled" type="button">
            {t("resource.edit", {}, { default: "Edit" })}
          </Button>
        </Link>
      </TopSection>
      <h1>{stripHtml(resource?.title)}</h1>
      {resource?.description && <p>{resource.description}</p>}
      {resource?.content?.main && (
        <div>{ReactHtmlParser(resource.content.main)}</div>
      )}
    </StyledResource>
  );
}
