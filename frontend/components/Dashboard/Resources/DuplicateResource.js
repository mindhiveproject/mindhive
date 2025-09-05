import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Icon } from "semantic-ui-react";

import { GET_RESOURCE } from "../../Queries/Resource";
import { CREATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES } from "../../Queries/Resource";

import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";
import StyledResource from "../../styles/StyledResource";

export default function DuplicateResource({ query, user, goBack }) {
  const router = useRouter();
  const { id } = query;

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
    title: `${resource.title} (Copy)`,
  });

  const [createResource] = useMutation(CREATE_RESOURCE, {
    variables: {
      input: {
        title: inputs?.title,
        description: inputs?.description,
        content: inputs?.content,
        settings: inputs?.settings,
        isPublic: inputs?.isPublic,
      },
    },
    refetchQueries: [{ query: GET_MY_RESOURCES, variables: { id: user?.id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createResource();
    alert("Resource duplicated successfully");
    router.push({ pathname: "/dashboard/resources" });
  }

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" /> Go Back
      </button>
      <h1>Duplicate Resource</h1>
      <ResourceForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save Duplicate</button>
    </StyledResource>
  );
}
