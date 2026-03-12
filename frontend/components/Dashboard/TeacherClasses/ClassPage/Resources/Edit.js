import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { GET_RESOURCE, GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import { UPDATE_RESOURCE, mergeResourceSettings } from "../../../../Mutations/Resource";
import ResourceForm from "../../../Resources/ResourceForm";
import StyledResource from "../../../../styles/StyledResource";
import useForm from "../../../../../lib/useForm";

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
  &:disabled {
    background: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

export default function EditResource({ resourceId, myclass, user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id: resourceId },
    skip: !resourceId,
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
    title: resource.title || "",
    description: resource.description || "",
    content: resource.content || "",
    settings: mergeResourceSettings(resource.settings),
    isPublic: resource.isPublic || false,
  });

  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [
      { query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    try {
      await updateResource({
        variables: {
          id: resourceId,
          title: inputs?.title,
          description: inputs?.description,
          content: inputs?.content,
          settings: inputs?.settings,
          isPublic: inputs?.isPublic,
        },
      });
      router.push({
        pathname: `/dashboard/myclasses/${myclass?.code}`,
        query: { page: "resources" },
      });
    } catch (err) {
      alert(err?.message || t("resource.saveError", "Failed to save."));
    }
  }

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
      </TopSection>
      <h1>{t("resource.editResource", "Edit resource")}</h1>
      <ResourceForm
        user={user}
        inputs={inputs}
        handleChange={handleChange}
        isAdmin={user?.permissions?.map((p) => p.name).includes("ADMIN")}
      />
      <PrimaryButton onClick={handleSave} disabled={loading}>
        {t("resource.saveChanges", "Save changes")}
      </PrimaryButton>
    </StyledResource>
  );
}
