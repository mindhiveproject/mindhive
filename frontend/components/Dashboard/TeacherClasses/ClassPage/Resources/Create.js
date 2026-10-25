import { useState } from "react";
import { useRouter } from "next/router";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import ResourceForm from "../../../Resources/ResourceForm";
import { EditorPage, EditorHeader } from "../ContentEditorLayout";

import { CREATE_RESOURCE } from "../../../../Mutations/Resource";
import { GET_CLASS_RESOURCES, GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../../../Queries/Resource";

const FORM_ID = "create-resource-form";

const INITIAL_INPUTS = { title: "", description: "", content: {} };

export default function CreateResource({ myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [inputs, setInputs] = useState(INITIAL_INPUTS);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const [createResource, { loading }] = useMutation(CREATE_RESOURCE, {
    refetchQueries: [
      { query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } },
      { query: GET_MY_RESOURCES, variables: { id: user?.id } },
      { query: GET_PUBLIC_RESOURCES },
    ],
    awaitRefetchQueries: true,
  });

  const goBack = () =>
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: { page: "resources", action: "add" },
    });

  async function handleSave(e) {
    e.preventDefault();
    await createResource({
      variables: {
        input: {
          ...inputs,
          classes: { connect: [{ id: myclass?.id }] },
        },
      },
    });
    setInputs(INITIAL_INPUTS);
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: {
        page: "resources",
        action: "add",
      },
    });
  }

  return (
    <EditorPage>
      <EditorHeader
        title={t("resource.startFromScratch", "Create from scratch")}
        onClose={goBack}
        closeLabel={t("resource.goBackToResources", "Back to class resources")}
        actions={
          <Button variant="filled" type="submit" form={FORM_ID} disabled={loading}>
            {loading ? t("common.saving", "Saving...") : t("resource.saveChanges", "Save changes")}
          </Button>
        }
      />
      <form id={FORM_ID} onSubmit={handleSave}>
        <ResourceForm user={user} inputs={inputs} handleChange={handleChange} loading={loading} />
      </form>
    </EditorPage>
  );
}
