import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { GET_RESOURCE } from "../../Queries/Resource";
import { CREATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES } from "../../Queries/Resource";

import { GET_PUBLIC_AND_CLASS_RESOURCES } from "../../Queries/Resource";

import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";

export default function CopyResource({ selector, query, user }) {
  const router = useRouter();

  const { id, p, c } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
    isPublic: false,
  });

  const [
    createResource,
    {
      data: createResourcesData,
      loading: createResourceLoading,
      error: createResourceError,
    },
  ] = useMutation(CREATE_RESOURCE, {
    variables: {
      input: {
        title: inputs?.title,
        description: inputs?.description,
        content: inputs?.content,
        parent: {
          connect: {
            id: resource?.id,
          },
        },
        proposalBoard: p
          ? {
              connect: {
                id: p,
              },
            }
          : null,
        isCustom: true,
      },
    },
    refetchQueries: [
      {
        query: GET_MY_RESOURCES,
        variables: {
          id: user?.id,
        },
      },
      {
        query: GET_PUBLIC_AND_CLASS_RESOURCES,
        variables: {
          classId: c,
        },
      },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createResource();
    alert("The resource is saved");
    // router.push({
    //   pathname: `/dashboard/resources`,
    // });
  }

  return (
    <div>
      <ResourceForm user={user} inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save as your own resource</button>
    </div>
  );
}
