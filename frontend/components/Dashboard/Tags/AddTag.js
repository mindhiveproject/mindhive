import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import TagForm from "./TagForm";

import { CREATE_TAG } from "../../Mutations/Tag";
import { GET_TAGS } from "../../Queries/Tag";

export default function AddTag({ user }) {
  const router = useRouter();
  const { t } = useTranslation("classes");
  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    description: "",
  });

  const [createTag, { data, loading, error }] = useMutation(CREATE_TAG, {
    refetchQueries: [{ query: GET_TAGS, variables: { id: user?.id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createTag({
      variables: {
        input: {
          ...inputs,
          parent: inputs?.parent ? { connect: inputs?.parent } : null,
        },
      },
    });
    router.push({
      pathname: "/dashboard/tags",
    });
  }

  return (
    <div>
      <TagForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
