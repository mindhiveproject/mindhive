import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import ReactHtmlParser from "react-html-parser";

import { GET_RESOURCE } from "../../../../Queries/Resource";
import StyledResource from "../../../../styles/StyledResource";

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #336F8A;
  border: 1.5px solid #336F8A;
  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #336f8a;
  color: #ffffff;
  &:hover {
    background: #ffc107;
    color: #1a1a1a;
  }
`;

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
        <SecondaryButton type="button" onClick={goBack}>
          ← {t("resource.goBackToResources", "Back to resources")}
        </SecondaryButton>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "resources", action: "edit", resource: resourceId },
          }}
          style={{ textDecoration: "none" }}
        >
          <PrimaryButton type="button">
            {t("resource.edit", "Edit")}
          </PrimaryButton>
        </Link>
      </TopSection>
      <h1>{resource?.title}</h1>
      {resource?.description && <p>{resource.description}</p>}
      {resource?.content?.main && (
        <div>{ReactHtmlParser(resource.content.main)}</div>
      )}
    </StyledResource>
  );
}
