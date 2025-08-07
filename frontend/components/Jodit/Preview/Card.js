"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Button, Icon, Accordion } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../Queries/Proposal";

export default function Card({ card, cardId, user }) {
  const { t } = useTranslation("builder");
  const [content, setContent] = useState(card?.content || "");
  const [revised, setRevised] = useState(
    card?.revisedContent || card?.content || ""
  );
  const [comment, setComment] = useState(card?.comment || "");
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, loading, success
  const [originalActive, setOriginalActive] = useState(false); // For accordion state, default collapsed
  const prevCardId = useRef(cardId); // Track previous cardId

  const isUsedLoggedIn = user;

  const [updateCard, { loading }] = useMutation(UPDATE_CARD_EDIT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      setHasContentChanged(
        newContent !== card?.content ||
          revised !== (card?.revisedContent || card?.content) ||
          comment !== card?.comment
      );
      setSaveStatus("idle");
    },
    editable: !card.isLocked,
  });

  const revisedEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: revised,
    onUpdate: ({ editor }) => {
      const newRevised = editor.getHTML();
      setRevised(newRevised);
      setHasContentChanged(
        newRevised !== (card?.revisedContent || card?.content) ||
          content !== card?.content ||
          comment !== card?.comment
      );
      setSaveStatus("idle");
    },
    editable: isUsedLoggedIn && card.settings?.includeInReport,
    immediatelyRender: false,
  });

  useEffect(() => {
    // Sync content and comment only when cardId changes or on initial mount
    if (prevCardId.current !== cardId) {
      if (editor && !card.isLocked) {
        editor.commands.setContent(card?.content || "");
        setContent(card?.content || "");
      }
      if (revisedEditor) {
        revisedEditor.commands.setContent(
          card?.revisedContent || card?.content || ""
        );
        setRevised(card?.revisedContent || card?.content || "");
      }
      setComment(card?.comment || "");
      setHasContentChanged(false);
      setSaveStatus("idle");
      prevCardId.current = cardId;
    } else {
      // Only sync comment if it changes
      if (card?.comment !== comment) {
        setComment(card?.comment || "");
      }
      // Sync content for unlocked cards if not changed
      if (
        editor &&
        !card.isLocked &&
        !hasContentChanged &&
        card?.content !== content
      ) {
        editor.commands.setContent(card?.content || "");
        setContent(card?.content || "");
      }
    }
  }, [card, cardId, editor, revisedEditor]);

  const saveChanges = async () => {
    if (!hasContentChanged || loading) return;

    setSaveStatus("loading");
    try {
      const input = { comment };
      if (isUsedLoggedIn && card.settings?.includeInReport) {
        input.revisedContent = revised;
      }
      if (!card.isLocked) {
        input.content = content;
      }
      await updateCard({
        variables: {
          id: cardId,
          input,
        },
      });
      setHasContentChanged(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setSaveStatus("idle");
    }
  };

  const Toolbar = ({ editor, isRevised = false }) => {
    if (!editor) return null;

    const handleButtonClick = (action) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      action();
    };

    return (
      <div
        tabIndex={0}
        style={{
          marginBottom: "10px",
          display: "grid",
          gridTemplateColumns: "auto auto auto auto 1fr",
          background: "#f5f5f5",
          padding: "5px 10px",
          borderRadius: "5px",
        }}
      >
        <Button
          icon
          onClick={() =>
            handleButtonClick(() => editor.chain().focus().toggleBold().run())
          }
          disabled={loading || !editor.isEditable}
          active={editor.isActive("bold")}
          aria-label="Toggle bold"
        >
          <Icon name="bold" />
        </Button>
        <Button
          icon
          onClick={() =>
            handleButtonClick(() => editor.chain().focus().toggleItalic().run())
          }
          disabled={loading || !editor.isEditable}
          active={editor.isActive("italic")}
          aria-label="Toggle italic"
        >
          <Icon name="italic" />
        </Button>
        <Button
          icon
          onClick={() =>
            handleButtonClick(() =>
              editor.chain().focus().toggleUnderline().run()
            )
          }
          disabled={loading || !editor.isEditable}
          active={editor.isActive("underline")}
          aria-label="Toggle underline"
        >
          <Icon name="underline" />
        </Button>
        <Button
          icon
          onClick={() =>
            handleButtonClick(() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            )
          }
          disabled={loading || !editor.isEditable}
          active={editor.isActive("heading", { level: 1 })}
          aria-label="Toggle heading 1"
        >
          <Icon name="header" />
        </Button>
        <Button
          primary
          size="medium"
          onClick={() => handleButtonClick(saveChanges)}
          disabled={loading || !hasContentChanged}
          style={{
            marginLeft: "15px",
            transition: "background-color 0.2s",
          }}
          aria-label="Save changes"
          aria-busy={loading}
          className={saveStatus === "success" ? "positive" : ""}
        >
          {saveStatus === "success" ? (
            <>
              <Icon name="check" /> Saved
            </>
          ) : loading ? (
            "Saving..."
          ) : isRevised ? (
            "Save Revised"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    );
  };

  // Map review steps to user-friendly text
  const reviewStepLabels = {
    ACTION_SUBMIT: "Proposal",
    ACTION_PEER_FEEDBACK: "Peer Feedback",
    ACTION_COLLECTING_DATA: "Collecting Data",
    ACTION_PROJECT_REPORT: "Project Report",
  };

  // Get status and review steps for display (static text)
  const statusText = card?.settings?.status || "No status";
  const reviewStepsText =
    card?.settings?.includeInReviewSteps?.length > 0
      ? card.settings.includeInReviewSteps
          .map((step) => reviewStepLabels[step])
          .join(", ")
      : "No review steps";

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <h2 style={{ marginBottom: "5px" }}>{card?.title}</h2>
      <div
        style={{
          marginBottom: "5px",
          fontSize: "12px",
          color: "#555",
          lineHeight: "1.2",
        }}
      >
        Status: {statusText} | Review Steps: {reviewStepsText}
      </div>
      {!card.isLocked && <Toolbar editor={editor} />}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 2,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {card.isLocked ? (
            <>
              <Accordion styled fluid>
                <Accordion.Title
                  active={originalActive}
                  onClick={() => setOriginalActive(!originalActive)}
                >
                  <Icon name="dropdown" />
                  {t("mainCard.forMindHiveNetwork", "Original Content")}
                </Accordion.Title>
                <Accordion.Content active={originalActive}>
                  <div
                    style={{
                      border: "1px solid #ccc",
                      padding: "10px",
                      overflow: "auto",
                    }}
                  >
                    {ReactHtmlParser(card?.content || "")}
                  </div>
                </Accordion.Content>
              </Accordion>
              {card.settings?.includeInReport && (
                <div>
                  <h3>{t("mainCard.revisedContent", "Revised Content")}</h3>
                  {isUsedLoggedIn ? (
                    <>
                      <Toolbar editor={revisedEditor} isRevised={true} />
                      <EditorContent
                        editor={revisedEditor}
                        style={{
                          border: "1px solid #ccc",
                          padding: "10px",
                          boxSizing: "border-box",
                          minHeight: "200px",
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        overflow: "auto",
                      }}
                    >
                      {ReactHtmlParser(
                        card?.revisedContent || card?.content || ""
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <EditorContent
              editor={editor}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                height: "100%",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>
        <div
          className="proposalCardComments"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div className="cardSubheader">
            {t("mainCard.comments", "Comments")}
          </div>
          {isUsedLoggedIn ? (
            <textarea
              rows="5"
              type="text"
              id="comment"
              name="comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setHasContentChanged(
                  e.target.value !== card?.comment ||
                    content !== card?.content ||
                    revised !== (card?.revisedContent || card?.content)
                );
              }}
              style={{
                flex: 1,
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                resize: "vertical",
              }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#f9f9f9",
                overflow: "auto",
              }}
            >
              {comment || t("mainCard.noComments", "No comments available.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
