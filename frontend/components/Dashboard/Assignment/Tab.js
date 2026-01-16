import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { Button } from "semantic-ui-react";
import moment from "moment";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";

import { ReadOnlyTipTap } from "../../TipTap/ReadOnlyTipTap";
import TipTapEditor from "../../TipTap/Main";

import { EDIT_HOMEWORK } from "../../Mutations/Homework";
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../Queries/Homework";
import { GET_CLASS_ASSIGNMENTS_FOR_STUDENTS } from "../../Queries/Assignment";

const HomeworkContainer = styled.div`
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e0e0e0;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-family: Lato;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
`;

const MetaInfo = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  font-family: Lato;
  font-size: 14px;
  color: #666666;
`;

const ActionsSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const StatusChipsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const StatusChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid;
  background: ${props => props.active ? '#D8D3E7' : '#ffffff'};
  border-color: ${props => props.active ? '#7D70AD' : '#D8D3E7'};
  color: ${props => props.active ? '#434343' : '#434343'};
  
  &:hover:not(:disabled) {
    border-color: ${props => props.active ? '#7D70AD' : '#7D70AD'};
    background: ${props => props.active ? '#D8D3E7' : '#F5F5F5'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeedbackGivenChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  border: 1.5px solid #8A2CF6;
  background: #D8D3E7;
  color: #8A2CF6; 
`;

const ContentSection = styled.div`
  margin-top: 24px;
`;

const EditableTitle = styled.div`
  margin-bottom: 16px;
  
  input {
    width: 100%;
    padding: 8px 12px;
    font-family: Lato;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    
    &:focus {
      outline: none;
      border-color: #336F8A;
    }
  }
`;

const EditorWrapper = styled.div`
  width: 100%;
  margin-top: 8px;
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const CommentsSection = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
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

const CommentsContent = styled.div`
  padding: 16px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: Lato;
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

export default function HomeworkTab({ user, assignment, homework }) {
  const { t } = useTranslation("classes");
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(homework?.title || "");
  
  // Get the content to display/edit - use homework content if it exists (even if empty string), 
  // only fall back to placeholder if content is null/undefined
  const getContent = useCallback(() => {
    // If homework has a content field (even if empty string), use it
    if (homework?.content !== undefined && homework?.content !== null) {
      return homework.content;
    }
    // Otherwise, use placeholder
    return assignment?.placeholder || "";
  }, [homework?.content, assignment?.placeholder]);
  
  const [editingContent, setEditingContent] = useState(() => getContent());

  // Update editingContent when homework data changes (e.g., after save or refetch)
  useEffect(() => {
    if (!isEditing) {
      setEditingContent(getContent());
    }
  }, [getContent, isEditing]);

  // Get classId from assignment if available
  const classId = assignment?.classes && assignment.classes.length > 0 
    ? assignment.classes[0]?.id 
    : null;

  const [editHomework, { loading }] = useMutation(EDIT_HOMEWORK, {
    refetchQueries: [
      {
        query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignment?.code },
      },
      // Refetch assignments list if classId is available
      ...(classId ? [{
        query: GET_CLASS_ASSIGNMENTS_FOR_STUDENTS,
        variables: { classId, userId: user?.id },
      }] : []),
    ],
  });

  const currentStatus = homework?.settings?.status || "Started";
  
  // Check user permissions
  const userPermissions = user?.permissions?.map((p) => p?.name) || [];
  const isStudent = userPermissions.includes("STUDENT");
  const isTeacher = userPermissions.includes("TEACHER");
  const isMentor = userPermissions.includes("MENTOR");
  const isAdmin = userPermissions.includes("ADMIN");
  const canSeeFeedbackGiven = isTeacher || isMentor || isAdmin;

  const handleStatusChange = (newStatus) => {
    editHomework({
      variables: {
        id: homework?.id,
        settings: { ...homework?.settings, status: newStatus },
        updatedAt: new Date(),
      },
    }).catch((err) => {
      console.error("Error updating status:", err);
      alert("Error updating status: " + err.message);
    });
  };

  const handleFeedbackRequestToggle = () => {
    if (currentStatus === "Needs feedback") {
      handleStatusChange("Started");
    } else {
      handleStatusChange("Needs feedback");
    }
  };

  const handleCompletedToggle = () => {
    if (currentStatus === "Completed") {
      handleStatusChange("Started");
    } else {
      handleStatusChange("Completed");
    }
  };

  const getCompletedButtonText = () => {
    if (currentStatus === "Completed") {
      return t("homework.submitted") || "Submitted";
    }
    return t("homework.markAsCompleted") || "Mark as completed";
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditingTitle(homework?.title || "");
    // Use existing homework content, or fall back to assignment placeholder
    setEditingContent(getContent());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingTitle(homework?.title || "");
    // Reset to existing homework content, or fall back to assignment placeholder
    setEditingContent(getContent());
  };

  const handleSave = async () => {
    try {
      await editHomework({
        variables: {
          id: homework?.id,
          title: editingTitle,
          content: editingContent,
          updatedAt: new Date(),
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving homework:", err);
      alert("Error saving homework: " + err.message);
    }
  };

  return (
    <HomeworkContainer>
      <TopBar>
        <ActionsSection>
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                loading={loading}
                disabled={loading}
                style={{
                  borderRadius: "100px",
                  background: "#336F8A",
                  fontSize: "12px",
                  color: "white",
                  border: "1px solid #336F8A",
                }}
              >
                Save
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  borderRadius: "100px",
                  background: "#f7f9fa",
                  fontSize: "12px",
                  color: "#666666",
                  border: "1px solid #e0e0e0",
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleEdit}
                style={{
                  borderRadius: "100px",
                  background: "#336F8A",
                  fontSize: "12px",
                  color: "white",
                  border: "1px solid #336F8A",
                }}
              >
                Edit
              </Button>
              {/* <DeleteHomework
                user={user}
                assignment={assignment}
                homework={homework}
              >
                <Button
                  style={{
                    borderRadius: "100px",
                    background: "#f7f9fa",
                    fontSize: "12px",
                    color: "#B9261A",
                    border: "1px solid #B9261A",
                  }}
                >
                  Delete
                </Button>
              </DeleteHomework> */}
              {isStudent && (
                <Button
                  onClick={handleFeedbackRequestToggle}
                  disabled={isEditing || loading}
                  style={{
                    borderRadius: "100px",
                    background: currentStatus === "Needs feedback" ? "#D8D3E7" : "#ffffff",
                    fontSize: "12px",
                    color: "#434343",
                    border: `1.5px solid ${currentStatus === "Needs feedback" ? "#7D70AD" : "#625B71"}`,
                  }}
                >
                  {currentStatus === "Needs feedback"
                    ? (t("teacherClass.feedbackRequested") || "Feedback requested")
                    : t("teacherClass.requestFeedback")}
                </Button>
              )}
              {currentStatus === "Completed" ? (
                <>
                  <Button
                    disabled
                    style={{
                      borderRadius: "100px",
                      background: "#D3E2F1",
                      fontSize: "12px",
                      color: "#3D85B0",
                      border: "1px solid #3D85B0",
                      cursor: "not-allowed",
                    }}
                  >
                    {getCompletedButtonText()}
                  </Button>
                  <Button
                    onClick={handleCompletedToggle}
                    disabled={isEditing || loading}
                    style={{
                      borderRadius: "100px",
                      background: "#FDF2D0",
                      fontSize: "12px",
                      color: "#434343",
                      border: "1px solid #434343",
                    }}
                  >
                    {t("homework.unsubmit") || "Unsubmit"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCompletedToggle}
                  disabled={isEditing || loading}
                  style={{
                    borderRadius: "100px",
                    background: "#ffffff",
                    fontSize: "12px",
                    color: "#336F8A",
                    border: "1px solid #336F8A",
                  }}
                >
                  {getCompletedButtonText()}
                </Button>
              )}
            </>
          )}
        </ActionsSection>
        <InfoSection>
          {isEditing ? (
            <EditableTitle>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Homework title"
              />
            </EditableTitle>
          ) : (
            <Title>{homework?.title}</Title>
          )}
          <MetaInfo>
            <span>{moment(homework?.createdAt).format("MMM D, YYYY")}</span>
            <StatusChipsContainer>
              {currentStatus === "Feedback given" && (
                <FeedbackGivenChip>
                  {t("teacherClass.feedbackGiven") || "Feedback given"}
                </FeedbackGivenChip>
              )}
              {canSeeFeedbackGiven && currentStatus !== "Feedback given" && (
                <StatusChip
                  active={currentStatus === "Feedback given"}
                  onClick={() => handleStatusChange("Feedback given")}
                  disabled={isEditing || loading}
                >
                  {t("teacherClass.feedbackGiven") || "Feedback given"}
                </StatusChip>
              )}
            </StatusChipsContainer>
          </MetaInfo>
        </InfoSection>
      </TopBar>
      
      <ContentSection>
        {isEditing ? (
          <EditorWrapper>
            <TipTapEditor
              content={editingContent}
              onUpdate={(newContent) => {
                setEditingContent(newContent);
              }}
            />
          </EditorWrapper>
        ) : (
          <ReadOnlyTipTap>
            <div className="ProseMirror">
              {ReactHtmlParser(getContent())}
            </div>
          </ReadOnlyTipTap>
        )}
      </ContentSection>
      
      {homework?.settings?.comment && (
        <CommentsSection>
          <CommentsLabel>{t("teacherClass.comments") || "Comments"}</CommentsLabel>
          <CommentsContent>
            {homework.settings.comment}
          </CommentsContent>
        </CommentsSection>
      )}
    </HomeworkContainer>
  );
}
