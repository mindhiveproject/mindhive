import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/dist/client/router";
import useTranslation from "next-translate/useTranslation";
import { useState } from "react";
import ReactHtmlParser from "react-html-parser";
import styled from "styled-components";

import TipTapEditor from "../../../../../TipTap/Main";  
import { StyledTipTap } from "../../../../../TipTap/StyledTipTap";
import { ReadOnlyTipTap } from "../../../../../TipTap/ReadOnlyTipTap";

import { GET_HOMEWORK } from "../../../../../Queries/Homework";
import { GET_ASSIGNMENT } from "../../../../../Queries/Assignment";
import { EDIT_HOMEWORK } from "../../../../../Mutations/Homework";
import useForm from "../../../../../../lib/useForm";

import Status from "./Status";

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

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

const UsernameChip = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: Lato;
  font-size: 16px;
  font-weight: 600;
  background: #E3F2FD;
  color: #1976D2;
  margin-bottom: 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-family: Lato;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
`;

const ShowButton = styled.button`
  padding: 8px 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  border-radius: 100px;
  border: 1.5px solid #336F8A;
  background: #ffffff;
  color: #336F8A;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const ContentArea = styled.div`
  margin-top: 16px;
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoLabel = styled.label`
  font-family: Lato;
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-family: Lato;
  font-size: 16px;
  font-weight: 400;
  color: #1a1a1a;
`;

const CommentsSection = styled.div`
  margin-top: 24px;
`;

const CommentsLabel = styled.label`
  display: block;
  font-family: Lato;
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const CommentsTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  font-family: Lato;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #336F8A;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
`;

export default function ReviewHomework({
  code,
  myclass,
  user,
  query,
  homeworkCode,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [showAssignment, setShowAssignment] = useState(false);

  // Fetch homework
  const { data: homeworkData, loading: homeworkLoading, error: homeworkError } = useQuery(GET_HOMEWORK, {
    variables: { code: homeworkCode },
  });
  const homework = homeworkData?.homework || {};

  // Fetch assignment
  const { data: assignmentData, loading: assignmentLoading } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
    skip: !code,
  });
  const assignment = assignmentData?.assignment || {};

  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const { inputs, handleChange, clearForm } = useForm({
    ...homework,
  });

  const [editHomework, { loading: editLoading }] = useMutation(EDIT_HOMEWORK, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: GET_HOMEWORK, variables: { code: homeworkCode } },
    ],
  });

  const handleSave = async () => {
    await editHomework({
      variables: {
        updatedAt: new Date(),
      },
    });
    router.push({
      pathname: `/dashboard/myclasses/${myclass?.code}`,
      query: {
        page: "assignments",
      },
    });
  };

  if (homeworkLoading) return <Container><div>Loading...</div></Container>;
  if (homeworkError) return <Container><div>Error: {homeworkError.message}</div></Container>;

  return (
    <Container>
      <TopSection>
        <ButtonContainer>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <SecondaryButton>← {t("assignment.goBack") || "Go back"}</SecondaryButton>
          </Link>
        </ButtonContainer>
        <UsernameChip>
          {homework?.author?.username || 'Unknown Student'}
        </UsernameChip>
      </TopSection>

      {/* Assignment Section - Hidden by default */}
      <Section>
        <SectionHeader>
          <SectionTitle>Assignment Instructions</SectionTitle>
          <ShowButton onClick={() => setShowAssignment(!showAssignment)}>
            {showAssignment ? "Hide" : "Show"}
          </ShowButton>
        </SectionHeader>
        {showAssignment && (
          <ContentArea>
            <div style={{ marginBottom: '24px' }}>
              <InfoLabel>Title</InfoLabel>
              <InfoValue>{stripHtml(assignment?.title || '')}</InfoValue>
            </div>
            {assignment?.content && (
              <div style={{ marginBottom: '24px' }}>
                <InfoLabel>Student Instructions</InfoLabel>
                <ReadOnlyTipTap>
                  <div className="ProseMirror">
                    {ReactHtmlParser(assignment?.content || "")}
                  </div>
                </ReadOnlyTipTap>
              </div>
            )}
            {assignment?.placeholder && (
              <div>
                <InfoLabel>Placeholder for student answer box</InfoLabel>
                <ReadOnlyTipTap>
                  <div className="ProseMirror">
                    {ReactHtmlParser(assignment?.placeholder || "")}
                  </div>
                </ReadOnlyTipTap>
              </div>
            )}
          </ContentArea>
        )}
      </Section>

      {/* Student's Homework Section */}
      <Section>
        <SectionTitle>Student's Submission</SectionTitle>
        <StyledTipTap>
          <TipTapEditor
            content={inputs?.content}
            onUpdate={(newContent) => {
              handleChange({ target: { name: "content", value: newContent } });
            }}
          />
        </StyledTipTap>
      </Section>

      {/* Information and Feedback Section */}
      <Section>
        <SectionTitle>Review & Feedback</SectionTitle>
        <InfoSection>
          <InfoItem>
            <InfoLabel>{t("teacherClass.status") || "Status"}</InfoLabel>
            <Status settings={inputs?.settings} handleChange={handleChange} />
          </InfoItem>
          {inputs?.updatedAt && (
            <InfoItem>
              <InfoLabel>{t("teacherClass.lastUpdated") || "Last Updated"}</InfoLabel>
              <InfoValue>{moment(inputs?.updatedAt).format("MMMM D, YYYY, h:mm a")}</InfoValue>
            </InfoItem>
          )}
        </InfoSection>

        <CommentsSection>
          <CommentsLabel>{t("teacherClass.comments") || "Comments"}</CommentsLabel>
          <CommentsTextarea
            id="comment"
            name="comment"
            value={inputs?.settings?.comment || ''}
            onChange={(e) => {
              handleChange({
                target: {
                  name: "settings",
                  value: { ...inputs?.settings, comment: e.target.value },
                },
              });
            }}
            placeholder="Add your feedback and comments here..."
          />
        </CommentsSection>
      </Section>

      {/* Action Buttons */}
      <ActionButtons>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <SecondaryButton>{t("teacherClass.closeWithoutSaving") || "Close without saving"}</SecondaryButton>
        </Link>
        <PrimaryButton
          onClick={handleSave}
          disabled={editLoading || homeworkLoading}
        >
          {editLoading ? (t("teacherClass.saving") || "Saving...") : (t("teacherClass.saveAndClose") || "Save and close")}
        </PrimaryButton>
      </ActionButtons>
    </Container>
  );
}
