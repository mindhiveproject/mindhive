import { useQuery } from "@apollo/client";
import { Modal, Button } from "semantic-ui-react";
import styled from "styled-components";
import ReactHtmlParser from "react-html-parser";
import { GET_AN_ASSIGNMENT } from "../Queries/Assignment";
import { ReadOnlyTipTap } from "./ReadOnlyTipTap";

// Styled Components
const StyledModal = styled(Modal)`
  border-radius: 12px !important;
  overflow: hidden;
`;

const StyledHeader = styled(Modal.Header)`
  background: #f9fafb;
  border-bottom: 1px solid #e0e0e0;
`;

const StyledContent = styled(Modal.Content)`
  background: #ffffff !important;
  padding: 24px !important;
`;

const StyledActions = styled(Modal.Actions)`
  background: #f9fafb !important;
  border-top: 1px solid #e0e0e0 !important;
`;

const Title = styled.h2`
  color: #274E5B;
`;

const Section = styled.div`
  margin-top: 2rem;
`;

const WarningSection = styled.div`
  display: flex;
  font-size: 14px;
  width: fit-content;
  color: white;
  background: #625B71;
  padding: 8px 16px 8px 16px ;
  margin: 16px;
  // border: 1px solid #FDF2D0;
  border-radius: 8px;
`;

const SectionTitle = styled.h3`
  color: #274E5B;
  padding: 16px;
  // margin-bottom: 24px;
  // border-bottom: 2px solid #274E5B;
  // border-top: 2px solid #274E5B;
`;

const ReadOnlyTipTapWrapper = styled.div`
  margin-left: 16px;
  padding: 16px;
  // margin-bottom: 24px;
  border: 1px solid #D3E0E3;
  border-radius: 16px;
`;

const CloseButton = styled(Button)`
  border-radius: 100px !important;
  background: #336F8A !important;
  font-size: 16px !important;
  color: white !important;
  border: 1px solid #336F8A !important;
`;

// Strip HTML tags from text
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const AssignmentViewModal = ({ open, t, onClose, assignmentId }) => {

  const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
    variables: { id: assignmentId },
    fetchPolicy: "network-only",
    skip: !assignmentId,
  });

  if (!assignmentId) return null;
  if (loading) return <p>{t("common.loading", "Loading assignment...")}</p>;
  if (error) return <p>{t("common.errorLoading", "Error loading assignment")}</p>;

  const assignment = data?.assignments?.[0];
  const content = assignment?.content || "";
  const placeholder = assignment?.placeholder || "";

  return (
    <StyledModal open={open} onClose={onClose} size="large">
      <StyledHeader>
        {t("board.expendedCard.viewingAssignment", "Viewing Assignment:")}
        <Title>{stripHtml(assignment?.title || '')}</Title>
      </StyledHeader>

      <StyledContent scrolling>
        <div className="assignmentContent">
          <Section>
            <SectionTitle>
              {t("assignment.instructions", "Student Instructions")}
            </SectionTitle>
            <ReadOnlyTipTapWrapper>
              <ReadOnlyTipTap>
                <div className="ProseMirror">
                  {ReactHtmlParser(content)}
                </div>
              </ReadOnlyTipTap>
            </ReadOnlyTipTapWrapper>
          </Section>

          {user?.permissions == "PARTICIPANT" && user?.permissions == "STUDENT" && (
            <>
              <SectionTitle>
                {t("assignment.placeholderDescription", "Placeholder presented to students")}
              </SectionTitle>
              {placeholder ? (
                <Section>
                  <ReadOnlyTipTapWrapper>
                    <ReadOnlyTipTap>
                      <div className="ProseMirror">
                        {ReactHtmlParser(placeholder)}
                      </div>
                    </ReadOnlyTipTap>
                  </ReadOnlyTipTapWrapper>
                </Section>
              ) : (
                <WarningSection>
                  {t("assignment.noPlaceholder", "This assignment has no predefined placeholder")}
                </WarningSection>
              )}
            </>
          )}
        </div>
      </StyledContent>

      <StyledActions>
        <CloseButton onClick={onClose}>
          {t("board.expendedCard.close", "Close")}
        </CloseButton>
      </StyledActions>
    </StyledModal>
  );
};

export default AssignmentViewModal;
