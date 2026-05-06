import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
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
import Button from "../../DesignSystem/Button";

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
      <Button
        className="goBackBtn"
        variant="outline"
        onClick={goBack}
        // leadingIcon={<img src="/assets/icons/back.svg" alt="" aria-hidden width={18} height={18} />}
      >
        {t("boardManagement.goBackToResourceArea")}
      </Button>
      <h1>{t("boardManagement.customizeRessource")}</h1>
      <ResourceForm user={user} inputs={inputs} handleChange={handleChange} />
      <Button onClick={handleSave}>{t("boardManagement.saveOwnRessource")}</Button>
    </StyledResource>
  );
}
