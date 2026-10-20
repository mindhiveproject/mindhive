import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import { GET_ASSIGNMENT } from "../../../../Queries/Assignment";
import { ReadOnlyTipTap } from "../../../../TipTap/ReadOnlyTipTap";
import ReviewHomework from "./Homework/Review";
import Button from "../../../../DesignSystem/Button";
import { EditorPage, EditorHeader, PreviewSection } from "../ContentEditorLayout";

export default function ViewAssignment({ code, myclass, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { homework } = query;
  
  // Always call useQuery, but skip it when viewing a specific homework
  const { data, loading, error } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
    skip: !!homework, // Skip query when viewing a specific homework
  });
  const assignment = data?.assignment || {
    title: "",
    content: "",
    placeholder: "",
    homework: [],
  };
  
  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };
  
  // If we're viewing a specific homework, show ReviewHomework directly (homework content)
  if (homework) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <ReviewHomework
          code={code}
          myclass={myclass}
          user={user}
          query={query}
          homeworkCode={homework}
        />
      </div>
    );
  }

  if (loading) return <EditorPage><div>Loading...</div></EditorPage>;
  if (error) return <EditorPage><div>Error: {error.message}</div></EditorPage>;

  // When previewing assignment (no homework param), show assignment content
  const titleText = stripHtml(assignment?.title || '');

  return (
    <EditorPage>
      <EditorHeader
        title={titleText}
        onClose={() =>
          router.push({
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "assignments" },
          })
        }
        closeLabel={t("assignment.goBack", {}, { default: "Go back" })}
        actions={
          <Button
            variant="filled"
            type="button"
            onClick={() =>
              router.push({
                pathname: `/dashboard/myclasses/${myclass?.code}`,
                query: { page: "assignments", action: "edit", assignment: assignment?.code },
              })
            }
          >
            {t("assignment.edit", {}, { default: "Edit" })}
          </Button>
        }
      />

      {/* Assignment Preview Content */}
      {assignment?.content && (
        <PreviewSection>
          <h2>{t("assignment.instructions", {}, { default: "Instructions" })}</h2>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.content || "")}
            </div>
          </ReadOnlyTipTap>
        </PreviewSection>
      )}

      {assignment?.placeholder && (
        <PreviewSection>
          <h2>{t("assignment.placeholderDescription", {}, { default: "Placeholder presented to students" })}</h2>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.placeholder || "")}
            </div>
          </ReadOnlyTipTap>
        </PreviewSection>
      )}
    </EditorPage>
  );
}
