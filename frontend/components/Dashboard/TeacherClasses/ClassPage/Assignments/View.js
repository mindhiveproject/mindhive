import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { GET_ASSIGNMENT } from "../../../../Queries/Assignment";
import { ReadOnlyTipTap } from "../../../../TipTap/ReadOnlyTipTap";
import ReviewHomework from "./Homework/Review";

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

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ViewContainer = styled.div`
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

export default function ViewAssignment({ code, myclass, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { homework } = query;
  
  // Always call useQuery, but skip it when viewing a specific homework
  const { data, loading, error } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
    skip: !!homework, // Skip query when viewing a specific homework
  });
  const assignment = data?.assignment || {
    title: "",
    content: "",
    placeholder: "",
    homework: [],
  };
  
  // Strip HTML from title
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };
  
  // If we're viewing a specific homework, show ReviewHomework directly (homework content)
  if (homework) {
    return (
      <ViewContainer>
        <ReviewHomework
          code={code}
          myclass={myclass}
          user={user}
          query={query}
          homeworkCode={homework}
        />
      </ViewContainer>
    );
  }

  if (loading) return <ViewContainer><div>Loading...</div></ViewContainer>;
  if (error) return <ViewContainer><div>Error: {error.message}</div></ViewContainer>;

  // When previewing assignment (no homework param), show assignment content
  const titleText = stripHtml(assignment?.title || '');

  return (
    <ViewContainer>
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
            <SecondaryButton>← {t("assignment.goBack")}</SecondaryButton>
          </Link>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "edit",
                assignment: assignment?.code,
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <PrimaryButton>{t("assignment.edit")}</PrimaryButton>
          </Link>
        </ButtonContainer>
        <HeaderTitle>{titleText}</HeaderTitle>
      </TopSection>

      {/* Assignment Preview Content */}
      {assignment?.content && (
        <ContentSection>
          <ContentTitle>Student Instructions</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.content || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}

      {assignment?.placeholder && (
        <ContentSection>
          <ContentTitle>Placeholder for student answer box</ContentTitle>
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(assignment.placeholder || "")}
            </div>
          </ReadOnlyTipTap>
        </ContentSection>
      )}
    </ViewContainer>
  );
}
