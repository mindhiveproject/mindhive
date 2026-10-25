import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { assignmentMediaLibraryProps } from "../../../../Mutations/MediaAsset";

import useTranslation from "next-translate/useTranslation";
import useForm from "../../../../../lib/useForm";

import { GET_CLASS_ASSIGNMENTS, GET_ASSIGNMENT } from "../../../../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../../../../Mutations/Assignment";
import Button from "../../../../DesignSystem/Button";
import { EditorPage, EditorHeader } from "../ContentEditorLayout";
import AssignmentFields from "./AssignmentFields";

const FORM_ID = "edit-assignment-form";

export default function EditAssignment({ code, myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data, loading: queryLoading } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
    skip: !code,
  });
  const assignment = data?.assignment;
  const mediaLibraryProps = assignmentMediaLibraryProps({
    userId: user?.id,
    assignmentId: assignment?.id,
  });

  // Ensure classes is always an array and includes the current class
  const getInitialClasses = () => {
    if (!assignment?.classes || !Array.isArray(assignment.classes)) {
      return [{ id: myclass?.id }];
    }
    // Check if current class is already in the list
    const hasCurrentClass = assignment.classes.some(
      (cls) => cls?.id === myclass?.id
    );
    if (hasCurrentClass) {
      return assignment.classes;
    }
    // Add current class if not present
    return [...assignment.classes, { id: myclass?.id }];
  };

  const { inputs, handleChange, clearForm } = useForm({
    title: assignment?.title || "",
    content: assignment?.content || "",
    placeholder: assignment?.placeholder || "",
    classes: getInitialClasses(),
  });

  const [editAssignment, { loading }] = useMutation(EDIT_ASSIGNMENT, {
    variables: {
      id: assignment?.id,
      input: {
        title: inputs?.title,
        content: inputs?.content,
        placeholder: inputs?.placeholder,
        classes: inputs?.classes && Array.isArray(inputs.classes)
          ? { set: inputs.classes.map((cl) => ({ id: cl?.id || cl })) }
          : { set: [{ id: myclass?.id }] },
        tags: inputs?.tags ? { set: inputs?.tags } : null,
      },
    },
    refetchQueries: [
      {
        query: GET_CLASS_ASSIGNMENTS,
        variables: { classId: myclass?.id },
      },
      {
        query: GET_ASSIGNMENT,
        variables: { code },
      },
    ],
  });

  const goBack = () =>
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "assignments" },
    });

  async function handleSave(e) {
    e.preventDefault();
    await editAssignment();
    clearForm();
    goBack();
  }

  if (queryLoading) return <div>{t("common.loading", {}, { default: "Loading…" })}</div>;
  if (!assignment) return <div>{t("assignment.notFound", {}, { default: "Assignment not found" })}</div>;

  return (
    <EditorPage>
      <EditorHeader
        title={t("assignment.editAssignment")}
        onClose={goBack}
        closeLabel={t("assignment.goBack", {}, { default: "Go back" })}
        actions={
          <Button variant="filled" type="submit" form={FORM_ID} disabled={loading}>
            {loading
              ? t("teacherClass.saving", {}, { default: "Saving..." })
              : t("assignment.saveLink", {}, { default: "Save and Link" })}
          </Button>
        }
      />
      <form id={FORM_ID} onSubmit={handleSave}>
        <AssignmentFields
          inputs={inputs}
          handleChange={handleChange}
          mediaLibraryProps={mediaLibraryProps}
        />
      </form>
    </EditorPage>
  );
}
