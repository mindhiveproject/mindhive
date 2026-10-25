import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";

import { GET_RESOURCE } from "../../../../Queries/Resource";
import { stripHtml } from "../../../../Proposal/Card/Forms/utils";
import Button from "../../../../DesignSystem/Button";
import { EditorPage, EditorHeader, PreviewSection } from "../ContentEditorLayout";

export default function ViewResource({ resourceId, myclass, user, query }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id: resourceId },
    skip: !resourceId,
    // Other screens save resources without refreshing the cached content.
    fetchPolicy: "cache-and-network",
  });
  const resource = data?.resource || {};

  const goBack = () => {
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "resources" },
    });
  };

  if (!resourceId) return <p>{t("resource.notFound", "Resource not found.")}</p>;
  if (loading && !data) return <p>{t("common.loading", "Loading…")}</p>;
  if (error) return <p>{t("resource.errorLoading", "Error loading resource.")}</p>;

  return (
    <EditorPage>
      <EditorHeader
        title={stripHtml(resource?.title)}
        onClose={goBack}
        closeLabel={t("resource.goBackToResources", {}, { default: "Back to class resources" })}
        actions={
          <Button
            variant="filled"
            type="button"
            onClick={() =>
              router.push({
                pathname: `/dashboard/myclasses/${myclass?.code}`,
                query: { page: "resources", action: "edit", resource: resourceId },
              })
            }
          >
            {t("resource.edit", {}, { default: "Edit" })}
          </Button>
        }
      />
      {(resource?.description || resource?.content?.main) && (
        <PreviewSection>
          {resource?.description && <p>{resource.description}</p>}
          {resource?.content?.main && (
            <div>{ReactHtmlParser(resource.content.main)}</div>
          )}
        </PreviewSection>
      )}
    </EditorPage>
  );
}
