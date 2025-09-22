import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { GET_RESOURCE } from "../../Queries/Resource";
import { CREATE_RESOURCE } from "../../Mutations/Resource";
import {
  GET_MY_RESOURCES,
  GET_PUBLIC_AND_CLASS_RESOURCES,
} from "../../Queries/Resource";

import useForm from "../../../lib/useForm";
import ResourceForm from "./ResourceForm";
import StyledResource from "../../styles/StyledResource";

export default function CopyResource({ query, user, goBack }) {
  const router = useRouter();
  const { id, p, c } = query;
  const { t } = useTranslation("classes");

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  const { inputs, handleChange } = useForm({
    ...resource,
    isPublic: false,
  });

  const [createResource] = useMutation(CREATE_RESOURCE, {
    variables: {
      input: {
        title: inputs?.title,
        description: inputs?.description,
        content: inputs?.content,
        parent: { connect: { id: resource?.id } },
        proposalBoard: p ? { connect: { id: p } } : null,
        isCustom: true,
      },
    },
    refetchQueries: [
      { query: GET_MY_RESOURCES, variables: { id: user?.id } },
      { query: GET_PUBLIC_AND_CLASS_RESOURCES, variables: { classId: c } },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createResource();
    alert(t("boardManagement.savedRessource"));
    router.push({ pathname: "/dashboard/resources" });
  }

  return (
    <StyledResource>
      <button className="goBackBtn" onClick={goBack}>
        <Icon name="arrow left" /> {t("boardManagement.goBack")}
      </button>
      <h1>{t("boardManagement.customizeRessource")}</h1>
      <ResourceForm user={user} inputs={inputs} handleChange={handleChange} />
      <button onClick={handleSave}>{t("boardManagement.saveOwnRessource")}Save as Your Own Resource</button>
    </StyledResource>
  );
}
