"use client";

import { useMemo } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import useTranslation from "next-translate/useTranslation";

import CollaborationCursorExtension from "../../TipTap/CollaborationCursorExtension";
import { getUserColor } from "../../TipTap/Main";
import IconButton from "../../DesignSystem/IconButton";
import {
  CodeIcon,
  DataObjectIcon,
  FormatBoldIcon,
  FormatH1Icon,
  FormatH2Icon,
  FormatItalicIcon,
  FormatListBulletedIcon,
  FormatListNumberedIcon,
  FormatParagraphIcon,
  FormatQuoteIcon,
  FormatUnderlinedIcon,
  LinkIcon,
  LinkOffIcon,
  RedoIcon,
  UndoIcon,
} from "../../DesignSystem/Icons";

const ROOT_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
  minHeight: 0,
};

const TOOLBAR_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexWrap: "wrap",
  flexShrink: 0,
  padding: "4px 12px",
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  borderBottom: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const DIVIDER_STYLE = {
  width: 1,
  height: 24,
  margin: "0 4px",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const SCROLL_STYLE = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
  minHeight: 0,
  overflowY: "auto",
};

const INVITE_STYLE = {
  position: "absolute",
  top: 24,
  left: 24,
  right: 24,
  pointerEvents: "none",
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

// The document itself. ProseMirror renders into a div this component doesn't
// own, so its typography has to be reached through descendant selectors rather
// than the inline style objects the rest of the builder uses.
const CONTENT_STYLE = `
.Visuals-DocsEditor-Content { display: flex; flex: 1 1 auto; }
.Visuals-DocsEditor .ProseMirror {
  flex: 1 1 auto;
  padding: 24px;
  box-sizing: border-box;
  outline: none;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
}
.Visuals-DocsEditor .ProseMirror > * + * { margin-top: 12px; }
.Visuals-DocsEditor .ProseMirror p { margin: 0; }
.Visuals-DocsEditor .ProseMirror h1 {
  margin: 0;
  font: var(--MH-Type-Title-Large);
}
.Visuals-DocsEditor .ProseMirror h2 {
  margin: 0;
  font: var(--MH-Type-Title-Base);
}
.Visuals-DocsEditor .ProseMirror ul,
.Visuals-DocsEditor .ProseMirror ol { margin: 0; padding-left: 24px; }
.Visuals-DocsEditor .ProseMirror li p { margin: 0; }
.Visuals-DocsEditor .ProseMirror a {
  color: var(--MH-Theme-Primary-Dark, #336F8A);
  text-decoration: underline;
}
.Visuals-DocsEditor .ProseMirror code {
  padding: 2px 4px;
  border-radius: 4px;
  background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
}
.Visuals-DocsEditor .ProseMirror pre {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
  overflow-x: auto;
}
.Visuals-DocsEditor .ProseMirror pre code {
  padding: 0;
  background: none;
}
.Visuals-DocsEditor .ProseMirror blockquote {
  margin: 0;
  padding: 4px 16px;
  border-left: 4px solid var(--MH-Theme-Primary-Base, #69BBC4);
  color: var(--MH-Theme-Neutrals-Dark, #6A6A6A);
}
.Visuals-DocsEditor .collaboration-cursor__caret {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid #0d0d0d;
  border-right: 1px solid #0d0d0d;
  pointer-events: none;
  word-break: normal;
}
.Visuals-DocsEditor .collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  padding: 1px 4px;
  border-radius: 4px 4px 4px 0;
  color: #fff;
  font-family: Inter, sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: normal;
  white-space: nowrap;
  user-select: none;
}
`;

/**
 * One documentation page: a TipTap editor bound to a named fragment of the
 * visual's shared Yjs document, under a toolbar docked to the top of the panel.
 *
 * The provider is passed in rather than opened here so that every page of the
 * Documentation tab rides on the one socket the panel already holds — the
 * fragments all live in the same `visual:<id>` room.
 *
 * @param {object} provider - The panel's HocuspocusProvider.
 * @param {string} field - Yjs fragment to bind, e.g. "docs" or "docs:<pageId>".
 * @param {boolean} editable - False renders the page read-only, with no toolbar.
 * @param {{id?: string, username?: string}} [user] - Labels this client's caret.
 * @param {string} [emptyInvite] - Hint shown over an empty page.
 */
export default function DocsEditor({
  provider,
  field,
  editable,
  user = null,
  emptyInvite = null,
}) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        // Yjs owns the history in a collaborative document; StarterKit's own
        // undo stack would fight it.
        undoRedo: false,
        link: { openOnClick: false },
      }),
      Collaboration.configure({ document: provider.document, field }),
      CollaborationCursorExtension.configure({
        provider,
        user: {
          name: user?.username || "Editor",
          color: getUserColor(user?.id),
        },
      }),
    ],
    [provider, field, user?.id, user?.username],
  );

  const editor = useEditor({ extensions, editable, immediatelyRender: false }, [
    extensions,
  ]);

  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: instance }) => !instance || instance.isEmpty,
  });

  return (
    <div className="Visuals-DocsEditor" style={ROOT_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: CONTENT_STYLE }} />
      {editable ? <MenuBar editor={editor} /> : null}
      <div style={SCROLL_STYLE}>
        {/* The document is usually shorter than the panel; stretching it to
            fill means clicking the empty space below the text still lands in
            the editor. */}
        <EditorContent editor={editor} className="Visuals-DocsEditor-Content" />
        {emptyInvite && isEmpty ? (
          <p style={INVITE_STYLE} role="note">
            {emptyInvite}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The formatting controls, in the order YQ's own docs editor lists them so an
 * author moving between the two frontends finds the same toolbar.
 */
function MenuBar({ editor }) {
  const { t } = useTranslation("visuals");

  // `useEditor` no longer re-renders on every transaction, so the active states
  // below have to be pulled out of the editor explicitly.
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance
        ? {
            canUndo: instance.can().undo(),
            canRedo: instance.can().redo(),
            h1: instance.isActive("heading", { level: 1 }),
            h2: instance.isActive("heading", { level: 2 }),
            paragraph: instance.isActive("paragraph"),
            bold: instance.isActive("bold"),
            italic: instance.isActive("italic"),
            underline: instance.isActive("underline"),
            link: instance.isActive("link"),
            code: instance.isActive("code"),
            codeBlock: instance.isActive("codeBlock"),
            bulletList: instance.isActive("bulletList"),
            orderedList: instance.isActive("orderedList"),
            blockquote: instance.isActive("blockquote"),
          }
        : null,
  });

  if (!editor || !state) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt(t("linkPrompt", "Enter link URL:"), previous);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: /^(https?:)?\/\//.test(url) ? url : `https://${url}`,
        target: "_blank",
      })
      .run();
  };

  return (
    <div style={TOOLBAR_STYLE} role="toolbar">
      <ToolbarButton
        icon={<UndoIcon />}
        label={t("undo", "Undo")}
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={<RedoIcon />}
        label={t("redo", "Redo")}
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />
      <span style={DIVIDER_STYLE} />
      <ToolbarButton
        icon={<FormatH1Icon />}
        label={t("heading1", "Heading 1")}
        active={state.h1}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      />
      <ToolbarButton
        icon={<FormatH2Icon />}
        label={t("heading2", "Heading 2")}
        active={state.h2}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        icon={<FormatParagraphIcon />}
        label={t("paragraph", "Paragraph")}
        active={state.paragraph}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <span style={DIVIDER_STYLE} />
      <ToolbarButton
        icon={<FormatBoldIcon />}
        label={t("bold", "Bold")}
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<FormatItalicIcon />}
        label={t("italic", "Italic")}
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<FormatUnderlinedIcon />}
        label={t("underline", "Underline")}
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      {state.link ? (
        <ToolbarButton
          icon={<LinkOffIcon />}
          label={t("removeLink", "Remove link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
      ) : (
        <ToolbarButton
          icon={<LinkIcon />}
          label={t("addLink", "Add a link")}
          onClick={setLink}
        />
      )}
      <ToolbarButton
        icon={<CodeIcon />}
        label={t("inlineCode", "Inline code")}
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <span style={DIVIDER_STYLE} />
      <ToolbarButton
        icon={<DataObjectIcon />}
        label={t("codeBlock", "Code block")}
        active={state.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        icon={<FormatListBulletedIcon />}
        label={t("bulletList", "Bulleted list")}
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<FormatListNumberedIcon />}
        label={t("numberedList", "Numbered list")}
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={<FormatQuoteIcon />}
        label={t("blockquote", "Quote")}
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
    </div>
  );
}

/**
 * `tonal` reads as the pressed state of `text` — a fill appears where there was
 * none — which is what makes the active mark legible without outlining a button
 * that is already filled.
 */
function ToolbarButton({ icon, label, active = false, disabled, onClick }) {
  return (
    <IconButton
      variant={active ? "tonal" : "text"}
      elevated={false}
      icon={icon}
      ariaLabel={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
