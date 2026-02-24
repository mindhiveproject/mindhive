import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Button, Modal } from "semantic-ui-react";
import TipTapEditor from "../../../TipTap/Main";
import Chip from "../../../DesignSystem/Chip";
import { GET_AN_ASSIGNMENT } from "../../../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../../../Mutations/Assignment";
import { TYPO } from "./utils";

export default function AssignmentModal({
  open,
  t,
  onClose,
  assignmentId,
  user,
  onAssignmentPublicChange,
}) {
  const [editedAssignment, setEditedAssignment] = useState({
    title: "",
    content: "",
    placeholder: "",
  });
  const [hasChanges, setHasChanges] = useState(false);

  const styleField = {
    ...TYPO.label,
    padding: "20px",
    borderRadius: "16px",
    border: "0px",
    background: "rgba(51, 111, 138, 0.04)",
  };

  const editableFieldStyle = {
    ...styleField,
    minWidth: "100%",
  };

  // Add CSS for placeholder styling
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      [contenteditable][data-placeholder]:empty::before {
        content: attr(data-placeholder);
        color: #999;
        font-style: italic;
      }
      [contenteditable]:focus {
        outline: 2px solid #336F8A;
        outline-offset: -2px;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [editAssignment, { loading: editLoading }] = useMutation(EDIT_ASSIGNMENT, {
    variables: {
      id: assignmentId,
    },
    refetchQueries: [
      {
        query: GET_AN_ASSIGNMENT,
        variables: { id: assignmentId },
      },
    ],
  });

  const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
    variables: { id: assignmentId },
    fetchPolicy: "network-only",
    skip: !assignmentId,
  });

  useEffect(() => {
    if (data?.assignments?.[0] && data.assignments[0].id === assignmentId) {
      const assignment = data.assignments[0];
      const newState = {
        title: assignment.title || "",
        content: assignment.content || "",
        placeholder: assignment.placeholder || "",
      };
      setEditedAssignment(newState);
      setHasChanges(false);
    }
  }, [data, assignmentId]);

  const handleFieldChange = (field, value) => {
    setEditedAssignment((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await editAssignment({
        variables: {
          input: {
            title: editedAssignment.title,
            content: editedAssignment.content,
            placeholder: editedAssignment.placeholder,
          },
        },
      });
      setHasChanges(false);
      alert(t("assignment.saveSuccess", "Assignment saved successfully!"));
    } catch (err) {
      alert(err.message);
    }
  };

  const copyLink = () => {
    if (typeof window === "undefined") return;
    const assignment = data?.assignments?.[0];
    const link = `${window.location.origin}/dashboard/assignments/${assignment?.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = link;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t("assignment.linkCopied"));
  };

  if (!assignmentId) return null;
  if (loading) return <p>Loading assignment…</p>;
  if (error) return <p>Error loading assignment</p>;

  const assignment = data.assignments[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      style={{ borderRadius: "12px", overflow: "hidden" }}
    >
      <Modal.Header
        style={{
          background: "#f9fafb",
          borderBottom: "1px solid #e0e0e0",
          ...TYPO.titleS,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          {t("board.expendedCard.previewAssignment", "Preview Assignment")}
          {hasChanges && (
            <span style={{ ...TYPO.caption, color: "#8A2CF6" }}>
              {t("assignment.unsavedChanges", "(Unsaved changes)")}
            </span>
          )}
        </span>
        <Chip
          label={t("board.editMode", "You are in Edit Mode")}
          selected={false}
          shape="square"
        />
      </Modal.Header>
      <Modal.Content
        scrolling
        style={{ background: "#ffffff", padding: "24px" }}
      >
        <div>
          <p style={{ marginTop: "3rem", ...TYPO.sectionLabel }}>{t("board.expendedCard.title")}</p>
          <TipTapEditor
            content={editedAssignment.title}
            placeholder={t("assignment.titlePlaceholder", "Enter assignment title...")}
            onUpdate={(newContent) => handleFieldChange("title", newContent)}
            toolbarVisible={false}
          />
          <p style={{ marginTop: "3rem", ...TYPO.sectionLabel }}>{t("assignment.instructions")}</p>
          <TipTapEditor
            content={editedAssignment.content}
            placeholder={t("assignment.instructionsPlaceholder", "Enter assignment instructions...")}
            onUpdate={(newContent) => handleFieldChange("content", newContent)}
          />

          <p style={{ marginTop: "3rem", ...TYPO.sectionLabel }}>{t("assignment.placeholderInstructions")}</p>
          <TipTapEditor
            content={editedAssignment.placeholder}
            placeholder={t("assignment.instructionsPlaceholder", "Enter placeholder shown to students...")}
            onUpdate={(newContent) => handleFieldChange("placeholder", newContent)}
          />
        </div>
      </Modal.Content>
      <Modal.Actions style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}>
        {hasChanges && (
          <Button
            loading={editLoading}
            disabled={editLoading}
            style={{
              borderRadius: "100px",
              background: "#7D70AD",
              ...TYPO.bodyMedium,
              color: "white",
              border: "1px solid #7D70AD",
              marginRight: "10px",
            }}
            onClick={handleSave}
          >
            {t("assignment.save", "Save Changes")}
          </Button>
        )}

        {!hasChanges && (
          <>
            {(assignment?.classes?.length === 0 || !assignment.classes) && (
              <div
                style={{
                  background: "#fff7cd",
                  color: "#664d03",
                  border: "1px solid #ffecb5",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  ...TYPO.body,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    ...TYPO.labelSemibold,
                    marginRight: "8px",
                  }}
                >
                  &#9888;
                </span>
                {t(
                  "assignment.classWarning",
                  "This assignment is not connected to a class, you can do that by associating this project board to a class."
                )}
              </div>
            )}
            {assignment?.public ? (
              <>
                <Button
                  style={{
                    borderRadius: "100px",
                    background: "white",
                    ...TYPO.bodyMedium,
                    color: "#336F8A",
                    border: "1px solid #336F8A",
                  }}
                  onClick={copyLink}
                >
                  {t("assignment.copyLink")}
                </Button>
                <Button
                  style={{
                    borderRadius: "100px",
                    background: "white",
                    ...TYPO.bodyMedium,
                    color: "#336F8A",
                    border: "1px solid #336F8A",
                  }}
                  onClick={() => {
                    if (confirm(t("assignment.revokeConfirm"))) {
                      editAssignment({
                        variables: { input: { public: false } },
                      })
                        .then(() => {
                          onAssignmentPublicChange?.(assignmentId, false);
                        })
                        .catch((err) => {
                          alert(err.message);
                        });
                    }
                  }}
                >
                  {t("assignment.unpublish")}
                </Button>
              </>
            ) : (
              <Button
                style={{
                  borderRadius: "100px",
                  background: "white",
                  ...TYPO.bodyMedium,
                  color: "#336F8A",
                  border: "1px solid #336F8A",
                }}
                onClick={() => {
                  if (confirm(t("assignment.submitConfirm"))) {
                    editAssignment({
                      variables: { input: { public: true } },
                    })
                      .then(() => {
                        onAssignmentPublicChange?.(assignmentId, true);
                      })
                      .catch((err) => {
                        alert(err.message);
                      });
                  }
                }}
              >
                {t("assignment.publishToStudents")}
              </Button>
            )}
          </>
        )}

        <Button
          onClick={onClose}
          style={{
            borderRadius: "100px",
            background: "#336F8A",
            ...TYPO.bodyMedium,
            color: "white",
            border: "1px solid #336F8A",
          }}
        >
          {t("board.expendedCard.close", "Close")}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
