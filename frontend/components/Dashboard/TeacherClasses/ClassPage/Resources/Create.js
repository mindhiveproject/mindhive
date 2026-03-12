import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import ResourceForm from "../../../Resources/ResourceForm";

import { CREATE_RESOURCE } from "../../../../Mutations/Resource";
import { GET_CLASS_RESOURCES, GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../../../Queries/Resource";

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-family: Lato;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
`;

const FormContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
`;

const INITIAL_INPUTS = { title: "", description: "", content: {} };

export default function CreateResource({ myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [inputs, setInputs] = useState(INITIAL_INPUTS);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const [createResource, { loading }] = useMutation(CREATE_RESOURCE, {
    refetchQueries: [
      { query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } },
      { query: GET_MY_RESOURCES, variables: { id: user?.id } },
      { query: GET_PUBLIC_RESOURCES },
    ],
    awaitRefetchQueries: true,
  });

  async function handleSave(e) {
    e.preventDefault();
    await createResource({
      variables: {
        input: {
          ...inputs,
          classes: { connect: [{ id: myclass?.id }] },
        },
      },
    });
    setInputs(INITIAL_INPUTS);
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: {
        page: "resources",
        action: "add",
      },
    });
  }

  return (
    <FormContainer>
      <TopSection>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "resources",
              action: "add",
            },
          }}
          style={{ textDecoration: "none" }}
        >
          <Button variant="outline">← {t("resource.goBackToResources", "Back to class resources")}</Button>
        </Link>
        <HeaderTitle>{t("resource.startFromScratch", "Create from scratch")}</HeaderTitle>
      </TopSection>

      <form onSubmit={handleSave}>
        <ResourceForm user={user} inputs={inputs} handleChange={handleChange} loading={loading} />

        <ButtonContainer>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "resources",
                action: "add",
              },
            }}
            style={{ textDecoration: "none" }}
          >
            <Button variant="outline" type="button">
              {t("resource.cancel", "Cancel")}
            </Button>
          </Link>
          <Button variant="filled" type="submit" disabled={loading}>
            {loading ? t("common.saving", "Saving...") : t("resource.saveChanges", "Save changes")}
          </Button>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
}
