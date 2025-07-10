"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Button, Icon } from "semantic-ui-react";

import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../Queries/Proposal";

export default function Card({ card, cardId }) {
  const [content, setContent] = useState(card?.content || "");
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, loading, success

  const [updateCard, { loading }] = useMutation(UPDATE_CARD_EDIT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      setHasContentChanged(newContent !== card?.content);
      setSaveStatus("idle");
    },
    editable: true,
  });

  useEffect(() => {
    // Sync editor content when card prop changes
    if (editor && card?.content !== content) {
      editor.commands.setContent(card?.content || "");
      setContent(card?.content || "");
      setHasContentChanged(false);
      setSaveStatus("idle");
    }
  }, [card, editor]);

  const saveChanges = async () => {
    if (!hasContentChanged || loading) return;

    setSaveStatus("loading");
    try {
      await updateCard({
        variables: {
          id: cardId,
          input: {
            content: content,
          },
        },
      });
      setHasContentChanged(false);
      setSaveStatus("success");
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      setSaveStatus("idle");
    }
  };

  const Toolbar = ({ editor }) => {
    if (!editor) return null;

    const handleButtonClick = (action) => {
      // Ensure the editor doesn't trap focus
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
          disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
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
          ) : (
            "Save"
          )}
        </Button>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>{card?.title}</h2>
      <Toolbar editor={editor} />
      <div style={{ flex: 1, overflow: "auto" }}>
        <EditorContent
          editor={editor}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            height: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
