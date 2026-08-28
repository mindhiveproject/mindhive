import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import moment from "moment";
import { Button as SemanticButton } from "semantic-ui-react";

import { GET_ASSIGNMENT_FOR_STUDENT } from "../../Queries/Assignment";
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../Queries/Homework";
import { CREATE_HOMEWORK } from "../../Mutations/Homework";
import { ReadOnlyTipTap } from "../../TipTap/ReadOnlyTipTap"
import ReactHtmlParser from "react-html-parser";
import TipTapEditor from "../../TipTap/Main";
import useForm from "../../../lib/useForm";

import HomeworkTab from "./Tab";
import StyledClass from "../../styles/StyledClass";
import Homework from "./Homework/Main";
import Button from "../../DesignSystem/Button";

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font: var(--MH-Type-Heading-Small);
  letter-spacing: 0;
  padding-top: 16px;
  color: #1a1a1a;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const ContentSection = styled.div`
  margin-bottom: 32px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const ContentTitle = styled.h2`
  margin: 0 0 16px 0;
  font: var(--MH-Type-Title-Large);
  letter-spacing: 0;
  color: #1a1a1a;
`;

const EditorWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
`;

export default function AssignmentMain({ query, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { selector, homework } = query;
  const [showNewHomework, setShowNewHomework] = useState(false);

  const { data, loading, error } = useQuery(GET_ASSIGNMENT_FOR_STUDENT, {
    variables: { code: selector },
  });

  const assignment = data?.assignment || {};

  const { data: homeworkData, refetch: refetchHomeworks } = useQuery(GET_MY_HOMEWORKS_FOR_ASSIGNMENT, {
    variables: { userId: user?.id, assignmentCode: selector },
  });

  const homeworks = homeworkData?.homeworks || [];

  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Get the first class code for navigation back
  const classCode = assignment?.classes && assignment.classes.length > 0 
    ? assignment.classes[0]?.code 
    : null;

  // New homework form state
  const { inputs, handleChange, clearForm } = useForm({
    settings: { status: "Started" },
    title: "",
    placeholder: assignment?.placeholder || "",
  });

  const homeworkContent = useRef("");

  useEffect(() => {
    if (assignment?.placeholder && !homeworkContent.current) {
      homeworkContent.current = assignment.placeholder;
    }
  }, [assignment?.placeholder]);

  // Set title when form is shown
  useEffect(() => {
    if (showNewHomework && assignment?.title) {
      const strippedTitle = stripHtml(assignment.title);
      handleChange({
        target: {
          name: "title",
          value: `Assignment | ${strippedTitle} | ${moment().format("YYYY-MM-DD")} | ${user?.username || ''}`
        }
      });
    }
  }, [showNewHomework, assignment?.title, user?.username, handleChange]);

  // Mutation for creating homework
  const [createHomework, { loading: createLoading }] = useMutation(CREATE_HOMEWORK, {
    refetchQueries: [
      {
        query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: selector },
      },
    ],
  });

  const updateHomeworkContent = async (newContent) => {
    homeworkContent.current = newContent;
  };

  const handleCreateHomeworkDraft = async () => {
    try {
      await createHomework({
        variables: {
          ...inputs,
          content: homeworkContent?.current || inputs.placeholder,
          assignmentId: assignment?.id,
        },
      });
      clearForm();
      setShowNewHomework(false);
      if (refetchHomeworks) {
        refetchHomeworks();
      }
    } catch (error) {
      console.error("Error creating homework:", error);
      alert("Error creating homework: " + error.message);
    }
  };

  const handleCreateHomeworkSubmit = async () => {
    try {
      await createHomework({
        variables: {
          ...inputs,
          content: homeworkContent?.current || inputs.placeholder,
          assignmentId: assignment?.id,
          settings: {"status": "Completed"},
        },
      });
      clearForm();
      setShowNewHomework(false);
      if (refetchHomeworks) {
        refetchHomeworks();
      }
    } catch (error) {
      console.error("Error creating homework:", error);
      alert("Error creating homework: " + error.message);
    }
  };

  if (homework) {
    return (
      <StyledClass>
        <Homework
          user={user}
          assignmentCode={selector}
          homeworkCode={homework}
          btnName={t("board.save", {}, { default: "Save" })}
        />
      </StyledClass>
    );
  }

  if (loading) return <Container><div>Loading...</div></Container>;
  if (error) return <Container><div>Error: {error.message}</div></Container>;

  const titleText = stripHtml(assignment?.title || '');

  return (
    <Container>
      <TopSection>
        {classCode && (
          <ButtonContainer>
            <Link
              href={{
                pathname: `/dashboard/classes/${classCode}`,
                query: {
                  page: "assignments",
                },
              }}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline">{t("students.goBack", {}, { default: "Go back to class" })}</Button>
            </Link>
          </ButtonContainer>
        )}
        <HeaderTitle>{titleText}</HeaderTitle>
      </TopSection>

      {/* Assignment Content */}
      {assignment?.content && (
        <ContentSection>
          <ContentTitle>{t("assignment.instructions") || "Instructions"}</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.content || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}

      {assignment?.placeholder && user?.permissions.name == "PARTICIPANT" && user?.permissions.name == "STUDENT" && (
        <ContentSection>
          <ContentTitle>{t("assignment.placeholderDescription") || "Placeholder for student answer box"}</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.placeholder || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}

      {/* My Assignment Section */}
      <ContentSection>
        <ContentTitle>My assignment</ContentTitle>

        {/* Show existing homeworks */}
        {homeworks.length > 0 && (
          <div>
            {homeworks.map((homework) => (
              <HomeworkTab
                key={homework?.id}
                assignment={assignment}
                homework={homework}
                user={user}
              />
            ))}
          </div>
        )}

        {/* New Homework Section */}
        {homeworks.length < 1 && !showNewHomework && (
          <SemanticButton
            onClick={() => setShowNewHomework(true)}
            style={{
              borderRadius: "100px",
              background: "#336F8A",
              font: 'var(--MH-Type-Label-Base)',
              letterSpacing: 0,
              color: "white",
              border: "1px solid #336F8A",
              marginRight: "10px"
            }}
            disabled={createLoading}
          >
            {t("homework.createNewHomework", {}, { default: "Create New Assignment" })}
          </SemanticButton>
        )}

        {showNewHomework && (
          <div style={{
            border: "1px solid #A1A1A1",
            borderRadius: "8px",
            padding: "16px",
            background: "#FFF",
            boxShadow: "2px 2px 8px 0 rgba(0, 0, 0, 0.10)",
            marginTop: "16px",
          }}>
            <div style={{
              font: 'var(--MH-Type-Title-Large)',
              letterSpacing: 0,
              marginBottom: "16px"
            }}>
              {t("homework.createNewHomework", "Create New Assignment")}
            </div>

            <div style={{ marginBottom: "12px", width: "100%" }}>
              <p style={{ marginBottom: "0px" }}>
                {t("homework.homeworkTitle", "Assignment title")}
              </p>
              <EditorWrapper style={{ marginTop: "4px" }}>
                <TipTapEditor
                  content={inputs.title}
                  onUpdate={(newContent) => handleChange({
                    target: { name: "title", value: newContent }
                  })}
                  toolbarVisible={false}
                  placeholder={t("homework.homeworkTitle", "Assignment title")}
                />
              </EditorWrapper>
            </div>
            <p style={{ marginBottom: "0px" }}>
                {t("homework.assignmentContent", "Assignment content")}
              </p>
            <div style={{ marginBottom: "16px", width: "100%" }}>
              <EditorWrapper style={{
                minHeight: "100px",
                marginTop: "4px",
              }}>
                <TipTapEditor
                  content={homeworkContent.current || inputs.placeholder}
                  onUpdate={(newContent) => updateHomeworkContent(newContent)}
                />
              </EditorWrapper>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <SemanticButton
                onClick={handleCreateHomeworkSubmit}
                loading={createLoading}
                disabled={createLoading}
                style={{
                  borderRadius: "100px",
                  background: "#336F8A",
                  font: 'var(--MH-Type-Label-Base)',
                  letterSpacing: 0,
                  color: "white",
                  border: "1px solid #336F8A",
                  marginRight: "10px"
                }}
              >
                {t("homework.createHomeworkSubmit", {}, { default: "Create & Submit" })}
              </SemanticButton>
              <SemanticButton
                onClick={handleCreateHomeworkDraft}
                loading={createLoading}
                disabled={createLoading}
                style={{
                  borderRadius: "100px",
                  background: "white",
                  font: 'var(--MH-Type-Label-Base)',
                  letterSpacing: 0,
                  color: "#336F8A",
                  border: "1px solid #336F8A",
                  marginRight: "10px"
                }}
              >
                {t("homework.createHomeworkDraft", {}, { default: "Create Draft" })}
              </SemanticButton>
              <SemanticButton
                onClick={() => {
                  setShowNewHomework(false);
                  clearForm();
                }}
                style={{
                  borderRadius: "100px",
                  background: "#f7f9fa",
                  font: 'var(--MH-Type-Label-Base)',
                  letterSpacing: 0,
                  color: "#B9261A",
                  border: "1px solid #B9261A",
                  marginRight: "10px"
                }}
              >
                {t("homework.cancel", {}, { default: "Cancel" })}
              </SemanticButton>
            </div>
          </div>
        )}
      </ContentSection>
    </Container>
  );
}
