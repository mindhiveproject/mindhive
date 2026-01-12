import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { GET_ASSIGNMENT_FOR_STUDENT } from "../../Queries/Assignment";
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../Queries/Homework";
import { ReadOnlyTipTap } from "../../TipTap/ReadOnlyTipTap"
import ReactHtmlParser from "react-html-parser";

import NewHomework from "./New";
import HomeworkTab from "./Tab";
import StyledClass from "../../styles/StyledClass";
import Homework from "./Homework/Main";

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

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const Container = styled.div`
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
  font-family: Lato;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
`;

export default function AssignmentMain({ query, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { selector, homework } = query;

  const { data, loading, error } = useQuery(GET_ASSIGNMENT_FOR_STUDENT, {
    variables: { code: selector },
  });

  const assignment = data?.assignment || {};

  const { data: homeworkData } = useQuery(GET_MY_HOMEWORKS_FOR_ASSIGNMENT, {
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

  if (homework) {
    return (
      <StyledClass>
        <Homework
          user={user}
          assignmentCode={selector}
          homeworkCode={homework}
          btnName="Save"
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
              <SecondaryButton>← {t("students.goBack") || "Go back"}</SecondaryButton>
            </Link>
          </ButtonContainer>
        )}
        <HeaderTitle>{titleText}</HeaderTitle>
      </TopSection>

      {/* Assignment Content */}
      {assignment?.content && (
        <ContentSection>
          <ContentTitle>{t("assignment.instructions") || "Student Instructions"}</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.content || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}

      {assignment?.placeholder && (
        <ContentSection>
          <ContentTitle>{t("assignment.placeholderDescription") || "Placeholder for student answer box"}</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.placeholder || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}

      {/* My Homework Section */}
      <ContentSection>
        <ContentTitle>My homework</ContentTitle>

        {!homeworks.length && (
          <NewHomework user={user} assignment={assignment}>
            <div>
              <button>New homework</button>
            </div>
          </NewHomework>
        )}

        {homeworks.length > 0 && (
          <div className="assignments">
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
      </ContentSection>
    </Container>
  );
}
