import { useQuery } from "@apollo/client";
import { Modal, Button } from "semantic-ui-react";
import styled from "styled-components";
import ReactHtmlParser from "react-html-parser";
import { GET_RESOURCE } from "../Queries/Resource";
import { ReadOnlyTipTap } from "./ReadOnlyTipTap";

// Styled Components (aligned with AssignmentViewModal)
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
  color: #274e5b;
`;

const Section = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h3`
  color: #274e5b;
  padding: 16px;
`;

const ReadOnlyTipTapWrapper = styled.div`
  margin-left: 16px;
  padding: 16px;
  border: 1px solid #d3e0e3;
  border-radius: 16px;
`;

const CloseButton = styled(Button)`
  border-radius: 100px !important;
  background: #336f8a !important;
  font-size: 16px !important;
  color: white !important;
  border: 1px solid #336f8a !important;
`;

const stripHtml = (html) => {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "").trim();
};

const ResourceViewModal = ({ open, t, onClose, resourceId }) => {
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id: resourceId },
    fetchPolicy: "network-only",
    skip: !resourceId,
  });

  if (!resourceId) return null;
  if (loading) return <p>{t("common.loading", "Loading resource...")}</p>;
  if (error) return <p>{t("common.errorLoading", "Error loading resource")}</p>;

  const resource = data?.resource;
  const title = stripHtml(resource?.title || "");
  const description = resource?.description || "";
  const content = resource?.content?.main || "";

  return (
    <StyledModal open={open} onClose={onClose} size="large">
      <StyledHeader>
        {t("board.expendedCard.viewingResource", "Viewing Resource:")}
        <Title>{title || t("common.untitled", "Untitled")}</Title>
      </StyledHeader>

      <StyledContent scrolling>
        <div className="resourceContent">
          {description && (
            <Section>
              <SectionTitle>
                {t("board.expendedCard.description", "Description")}
              </SectionTitle>
              <ReadOnlyTipTapWrapper>
                <ReadOnlyTipTap>
                  <div className="ProseMirror">
                    {ReactHtmlParser(description)}
                  </div>
                </ReadOnlyTipTap>
              </ReadOnlyTipTapWrapper>
            </Section>
          )}
          <Section>
            <SectionTitle>{t("board.expendedCard.viewContent", "View Content")}</SectionTitle>
            <ReadOnlyTipTapWrapper>
              <ReadOnlyTipTap>
                <div className="ProseMirror">
                  {content ? ReactHtmlParser(content) : <p>{t("common.noContent", "No content.")}</p>}
                </div>
              </ReadOnlyTipTap>
            </ReadOnlyTipTapWrapper>
          </Section>
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

export default ResourceViewModal;
