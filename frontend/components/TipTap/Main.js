"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Button, Icon } from "semantic-ui-react";

import { StyledTipTap } from "./StyledTipTap";

export default function TipTapEditor({
  content,
  onUpdate,
  isEditable = true,
  toolbarVisible = true,
}) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content || "",
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editable: isEditable,
    immediatelyRender: false,
  });

  const Toolbar = () => {
    if (!editor || !toolbarVisible) return null;

    const handleStyleClick = (command, e) => {
      e.preventDefault();
      e.stopPropagation();
      if (editor.isEditable) {
        command();
      }
    };

    return (
      <div
        className="toolbar"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          icon
          className="toolbarButton"
          onClick={(e) =>
            handleStyleClick(() => editor.commands.toggleBold(), e)
          }
          disabled={!editor.isEditable}
          active={editor.isActive("bold")}
          aria-label="Toggle bold"
        >
          <Icon name="bold" />
        </Button>
        <Button
          icon
          className="toolbarButton"
          onClick={(e) =>
            handleStyleClick(() => editor.commands.toggleItalic(), e)
          }
          disabled={!editor.isEditable}
          active={editor.isActive("italic")}
          aria-label="Toggle italic"
        >
          <Icon name="italic" />
        </Button>
        <Button
          icon
          className="toolbarButton"
          onClick={(e) =>
            handleStyleClick(() => editor.commands.toggleUnderline(), e)
          }
          disabled={!editor.isEditable}
          active={editor.isActive("underline")}
          aria-label="Toggle underline"
        >
          <Icon name="underline" />
        </Button>
        <Button
          icon
          className="toolbarButton"
          onClick={(e) =>
            handleStyleClick(
              () => editor.commands.toggleHeading({ level: 1 }),
              e
            )
          }
          disabled={!editor.isEditable}
          active={editor.isActive("heading", { level: 1 })}
          aria-label="Toggle heading 1"
        >
          <Icon name="header" />
        </Button>
      </div>
    );
  };

  return (
    <StyledTipTap>
      <Toolbar />
      <EditorContent editor={editor} className="tiptapEditor" />
    </StyledTipTap>
  );
}
