import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { Icon } from "semantic-ui-react";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";
import StyledResource from "../../styles/StyledResource";

import { CREATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../Queries/Resource";

export default function AddResource({ user, goBack }) {
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
      variables: { input: inputs },
      refetchQueries: [
        {
          query: GET_MY_RESOURCES,
          variables: { id: user?.id },
        },
        { query: GET_PUBLIC_RESOURCES },
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
    router.push({ pathname: "/dashboard/resources" });
  }

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" />{t("boardManagement.back")}
      </button>
      <h1>{t("boardManagement.createNewRessource")}</h1>
      <ResourceForm inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave} disabled={loading}>
        {t("boardManagement.save")}
      </button>
    </StyledResource>
  );
}
