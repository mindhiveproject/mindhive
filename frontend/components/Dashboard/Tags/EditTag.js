import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_TAG } from "../../Queries/Tag";
import { UPDATE_TAG } from "../../Mutations/Tag";

import useForm from "../../../lib/useForm";
import TagForm from "./TagForm";

export default function EditTag({ selector, query, user }) {
  const { t } = useTranslation("common");
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
    refetchQueries: [{ query: GET_TAG, variables: { id } }],
  });

  async function handleSave(e) {
    e.preventDefault();
    await updateTag({
      variables: {
        id,
        input: {
          title: inputs?.title,
          description: inputs?.description,
          level: inputs?.level,
          updatedAt: new Date(),
          parent: inputs?.parent
            ? { connect: { id: inputs?.parent?.id } }
            : { disconnect: true },
        },
      },
    });
  }

  return (
    <div>
      <TagForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>{t("tag.save")}</button>
    </div>
  );
}
