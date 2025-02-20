import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { GET_RESOURCE } from "../../Queries/Resource";
import { UPDATE_RESOURCE } from "../../Mutations/Resource";
import { GET_PUBLIC_RESOURCES } from "../../Queries/Resource";

import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";

export default function EditResource({ selector, query, user }) {
  const router = useRouter();
  const [content, setContent] = useState("");

  const { id } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
  });

  const [
    updateResource,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_RESOURCE, {
    variables: inputs,
    refetchQueries: [
      { query: GET_RESOURCE, variables: { id } },
      { query: GET_PUBLIC_RESOURCES },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await updateResource({ variables: { updatedAt: new Date() } });
    alert("The resource is saved");
    // router.push({
    //   pathname: `/dashboard/resources`,
    // });
  }

  return (
    <div>
      <ResourceForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
