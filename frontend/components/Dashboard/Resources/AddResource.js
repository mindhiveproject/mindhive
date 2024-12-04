import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";

import ResourceForm from "./ResourceForm";

import { CREATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES } from "../../Queries/Resource";

export default function AddResource({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
    content: "",
  });

  const [createResource, { data, loading, error }] = useMutation(
    CREATE_RESOURCE,
    {
      variables: inputs,
      refetchQueries: [
        { query: GET_MY_RESOURCES, variables: { id: user?.id } },
      ],
    }
  );

  async function handleSave(e) {
    e.preventDefault();
    await createResource({
      variables: {
        code: nanoid(),
      },
    });
    router.push({
      pathname: "/dashboard/resources",
    });
  }

  return (
    <div>
      <ResourceForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
