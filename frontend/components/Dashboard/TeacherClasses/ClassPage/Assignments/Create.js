import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import TipTapEditor from "../../../../TipTap/Main";

import useTranslation from "next-translate/useTranslation";
import useForm from "../../../../../lib/useForm";

import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../../../../Mutations/Assignment";

// Styled button matching Figma design (Primary Action - Teal)
const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #336F8A;
  color: #ffffff;
  
  &:hover {
    background: #ffc107;
    color: #1a1a1a;
  }
  
  &:active {
    background: #4db6ac;
    color: #1a1a1a;
  }
  
  &:disabled {
    background: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

// Styled secondary button (Outline style from Figma)
const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #ffffff;
  color: #336F8A;
  border: 1.5px solid #336F8A;
  
  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }
  
  &:active {
    background: #e0f2f1;
    border-color: #4db6ac;
    color: #4db6ac;
  }
`;

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
        query: GET_MY_CLASS_ASSIGNMENTS,
        variables: { userId: user?.id, classId: myclass?.id },
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
          <SecondaryButton>← {t("assignment.goBack")}</SecondaryButton>
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
            <SecondaryButton type="button">Cancel</SecondaryButton>
          </Link>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Creating..." : t("assignment.saveLink")}
          </PrimaryButton>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
}
