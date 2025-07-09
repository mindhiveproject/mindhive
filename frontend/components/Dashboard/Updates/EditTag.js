import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { EDIT_UPDATE } from "../../Mutations/Update";
import { GET_UPDATE, GET_UPDATES } from "../../Queries/Update";

import useForm from "../../../lib/useForm";
import UpdateForm from "./UpdateForm";

export default function EditUpdate({ selector, query, user }) {
  const { t } = useTranslation("common");
  const router = useRouter();

  const { id } = query;
  const { data, loading, error } = useQuery(GET_UPDATE, {
    variables: { id },
  });
  const update = data?.update || {};

  const { inputs, handleChange } = useForm({
    link: update?.link,
    title: update?.content?.title,
    description: update?.content?.message,
  });

  const [
    editUpdate,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(EDIT_UPDATE, {
    refetchQueries: [
      { query: GET_UPDATES, variables: { updateArea: "PLATFORM" } },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await editUpdate({
      variables: {
        id,
        input: {
          link: inputs?.link,
          content: {
            title: inputs?.title,
            message: inputs?.description,
          },
          updatedAt: new Date(),
        },
      },
    });
    router.push({
      pathname: "/dashboard/updates",
    });
  }

  return (
    <div>
      <UpdateForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>{t("update.save")}</button>
    </div>
  );
}
