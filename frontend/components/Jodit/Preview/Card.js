"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { Button, Icon, Accordion } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import ReactHtmlParser from "react-html-parser";
import TipTapEditor from "../../TipTap/Main";

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

useEffect(() => {
    // Sync content and comment only when cardId changes or on initial mount
    if (prevCardId.current !== cardId) {
      setContent(card?.content || "");
      setRevised(card?.revisedContent || card?.content || "");
      setComment(card?.comment || "");
      setHasContentChanged(false);
      setSaveStatus("idle");
      prevCardId.current = cardId;
    } else if (saveStatus === "success") {
      // After successful save, sync all content from the refetched data
      setContent(card?.content || "");
      setRevised(card?.revisedContent || card?.content || "");
      setComment(card?.comment || "");
    } else {
      // Only sync comment if it changes
      if (card?.comment !== comment) {
        setComment(card?.comment || "");
      }
      // Sync content for unlocked cards if not changed
      if (!card.isLocked && !hasContentChanged && card?.content !== content) {
        setContent(card?.content || "");
      }
    }
  }, [card, cardId, saveStatus]);

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
      <div style={{display: "flex", justifyContent: "space-around",}}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%",}}>
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
        </div>
        {!card.isLocked && (
          <div style={{ 
            marginBottom: "10px",
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            }}>
            <Button
              primary
              size="medium"
              onClick={saveChanges}
              disabled={loading || !hasContentChanged}
              style={{
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
              ) : (
                "Save"
              )}
            </Button>
          </div>
        )}
      </div>
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
                      <Button
                        primary
                        size="medium"
                        onClick={saveChanges}
                        disabled={loading || !hasContentChanged}
                        style={{
                          marginBottom: "10px",
                          transition: "background-color 0.2s",
                        }}
                        aria-label="Save revised changes"
                        aria-busy={loading}
                        className={saveStatus === "success" ? "positive" : ""}
                      >
                        {saveStatus === "success" ? (
                          <>
                            <Icon name="check" /> Saved
                          </>
                        ) : loading ? (
                          "Saving..."
                        ) : (
                          "Save Revised"
                        )}
                      </Button>
                      <TipTapEditor
                        content={revised}
                        onUpdate={setRevised}
                        isEditable={
                          isUsedLoggedIn && card.settings?.includeInReport
                        }
                        toolbarVisible={true}
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
            <TipTapEditor
              content={content}
              onUpdate={(newContent) => {
                setContent(newContent);
                setHasContentChanged(
                  newContent !== card?.content ||
                    revised !== (card?.revisedContent || card?.content) ||
                    comment !== card?.comment
                );
                setSaveStatus("idle");
              }}
              isEditable={!card.isLocked}
              toolbarVisible={true}
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
            <TipTapEditor
              content={comment}
              onUpdate={(newComment) => {
                setComment(newComment);
                setHasContentChanged(
                  newComment !== card?.comment ||
                    content !== card?.content ||
                    revised !== (card?.revisedContent || card?.content)
                );
              }}
              isEditable={!card.isLocked}
              toolbarVisible={true}
              placeholder={t("mainCard.commentsPlaceholder", "Add your comment here...")}
              style={{
                flex: 1,
                width: "100%",
                minHeight: "100px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
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
