import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Icon } from "semantic-ui-react";

import { GET_RESOURCE } from "../../Queries/Resource";
import { UPDATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES } from "../../Queries/Resource";

import useTranslation from "next-translate/useTranslation";
import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";
import StyledResource from "../../styles/StyledResource";

export default function EditResource({
  selector,
  query,
  user,
  isAdmin,
  goBack,
}) {
  const router = useRouter();
  const { id } = query;
  const { t } = useTranslation("classes");
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
    title: resource.title || "",
    description: resource.description || "",
    content: resource.content || "",
    settings: resource.settings || "",
    isPublic: resource.isPublic || false,
  });

  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    variables: {
      id,
      title: inputs?.title,
      description: inputs?.description,
      content: inputs?.content,
      settings: inputs?.settings,
      isPublic: inputs?.isPublic,
    },
    refetchQueries: [{ query: GET_MY_RESOURCES, variables: { id: user?.id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await updateResource();
    alert("Resource updated successfully");
    router.push({ pathname: "/dashboard/resources" });
  }

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" /> {t("boardManagement.goBack")}
      </button>
      <h1>{t("boardManagement.editResource")}</h1>
      <ResourceForm
        user={user}
        inputs={inputs}
        handleChange={handleChange}
        isAdmin={isAdmin} // Pass isAdmin to show/hide isPublic checkbox
      />
      <button onClick={handleSave} disabled={loading}>
      {t("boardManagement.saveChanges")}
      </button>
    </StyledResource>
  );
}
