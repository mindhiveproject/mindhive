import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import { GET_TAG } from "../../Queries/Tag";
import { UPDATE_TAG } from "../../Mutations/Tag";

import useForm from "../../../lib/useForm";
import TagForm from "./TagForm";

export default function EditTag({ selector, query, user }) {
  const [content, setContent] = useState("");

  const { id } = query;
  const { data, loading, error } = useQuery(GET_TAG, {
    variables: { id },
  });
  const tag = data?.tag || {};

  const { inputs, handleChange } = useForm({
    ...tag,
  });

  const [
    updateTag,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_TAG, {
    variables: inputs,
    refetchQueries: [{ query: GET_TAG, variables: { id } }],
  });

  async function handleSave(e) {
    console.log({ e });
    e.preventDefault();
    await updateTag();
    // router.push({
    //   pathname: `/dashboard/tags`,
    // });
  }

  return (
    <div>
      <TagForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
