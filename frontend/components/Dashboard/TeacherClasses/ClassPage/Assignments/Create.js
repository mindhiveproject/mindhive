import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import TipTapEditor from "../../../../TipTap/Main";

import useTranslation from "next-translate/useTranslation";
import useForm from "../../../../../lib/useForm";

import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../../Mutations/Assignment";
import Button from "../../../../DesignSystem/Button";

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

const FormSection = styled.div`
  margin-bottom: 32px;
  
  .consentSelector p {
    display: none;
  }
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-family: Lato;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
`;

export default function CreateAssignment({ myclass, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { inputs, handleChange, clearForm } = useForm({
    title: "",
    content: "",
    placeholder: "",
  });

  const [createAssignment, { loading }] = useMutation(CREATE_ASSIGNMENT, {
    variables: {
      input: {
        ...inputs,
        classes: { connect: [{ id: myclass?.id }] },
        tags: inputs?.tags ? { connect: inputs?.tags } : null,
      },
    },
    refetchQueries: [
      {
        query: GET_CLASS_ASSIGNMENTS,
        variables: { classId: myclass?.id },
      },
    ],
  });

  async function handleSave(e) {
    e.preventDefault();
    await createAssignment();
    clearForm();
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: {
        page: "assignments",
      },
    });
  }

  // update content in the local state
  const handleContentChange = (content) => {
    handleChange({ target: { name: "content", value: content } });
  };

  // update title in the local state
  const handleTitleChange = (content) => {
    handleChange({ target: { name: "title", value: content } });
  };

  // update placeholder in the local state
  const handlePlaceholderChange = (content) => {
    handleChange({ target: { name: "placeholder", value: content } });
  };

  return (
    <FormContainer>
      <TopSection>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
              action: "add",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="outline">{t("assignment.goBack", {}, { default: "Go back" })}</Button>
        </Link>
        <HeaderTitle>Create Assignment from Scratch</HeaderTitle>
      </TopSection>

      <form onSubmit={handleSave}>
        <FormSection>
          <FormLabel htmlFor="title">
            {t("assignment.title")}
          </FormLabel>
          <TipTapEditor 
            content={inputs?.title || ""} 
            onUpdate={handleTitleChange}
            isEditable={true}
            toolbarVisible={false}
          />
        </FormSection>

        <FormSection>
          <FormLabel>
            Instruction for your students:
          </FormLabel>
          <TipTapEditor
            content={inputs?.content || ""}
            onUpdate={handleContentChange}
            isEditable={true}
            toolbarVisible={true}
          />
        </FormSection>

        <FormSection>
          <FormLabel>
            Placeholder for your students:
          </FormLabel>
          <TipTapEditor
            content={inputs?.placeholder || ""}
            onUpdate={handlePlaceholderChange}
            isEditable={true}
            toolbarVisible={true}
          />
        </FormSection>

        <ButtonContainer>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "add",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outline" type="button">{t("cancel", {}, { default: "Cancel" })}</Button>
          </Link>
          <Button variant="filled" type="submit" disabled={loading}>
            {loading ? t("assignment.creating", {}, { default: "Creating..." }) : t("assignment.saveLink", {}, { default: "Save and Link" })}
          </Button>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
}
