import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { assignmentMediaLibraryProps } from "../../../../Mutations/MediaAsset";

import useTranslation from "next-translate/useTranslation";
import useForm from "../../../../../lib/useForm";

import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import Button from "../../../../DesignSystem/Button";
import { EditorPage, EditorHeader } from "../ContentEditorLayout";
import AssignmentFields from "./AssignmentFields";

const FORM_ID = "create-assignment-form";

export default function CreateAssignment({ myclass, user }) {
  const mediaLibraryProps = assignmentMediaLibraryProps({
    userId: user?.id,
    assignmentId: null,
  });
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    content: "",
    placeholder: "",
  });

  const [createAssignment, { loading }] = useMutation(CREATE_ASSIGNMENT, {
    variables: {
      input: {
        ...inputs,
        classes: { connect: [{ id: myclass?.id }] },
        tags: inputs?.tags ? { connect: inputs?.tags } : null,
      },
    },
    refetchQueries: [
      {
        query: GET_CLASS_ASSIGNMENTS,
        variables: { classId: myclass?.id },
      },
    ],
  });

  const goBack = () =>
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "assignments", action: "add" },
    });

  async function handleSave(e) {
    e.preventDefault();
    await createAssignment();
    clearForm();
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: {
        page: "assignments",
      },
    });
  }

  return (
    <EditorPage>
      <EditorHeader
        title={t("assignment.createFromScratch", {}, { default: "Create from scratch" })}
        onClose={goBack}
        closeLabel={t("assignment.goBack", {}, { default: "Go back" })}
        actions={
          <Button variant="filled" type="submit" form={FORM_ID} disabled={loading}>
            {loading
              ? t("assignment.creating", {}, { default: "Creating..." })
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
