"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Button, Icon, Dropdown } from "semantic-ui-react";

import { StyledTipTap } from "./StyledTipTap";

// Custom extension to handle base64 image pasting
const PasteImageExtension = Extension.create({
  name: 'pasteImage',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteImage'),
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const { schema } = view.state;
            const text = clipboardData.getData('text/plain');

            if (text) {
              const trimmedText = text.trim();

              // Case 1: Raw data URI (starts with data:image/)
              if (trimmedText.startsWith('data:image/')) {
                try {
                  const node = schema.nodes.image.create({ src: trimmedText });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                  return true;
                } catch (err) {
                  console.error("Error inserting image from data URI", err);
                }
              }

              // Case 2: <img src="data:image/..."> (extract src attribute safely)
              const imgTagStart = trimmedText.indexOf('<img');
              if (imgTagStart !== -1) {
                const srcMatch = trimmedText.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
                if (srcMatch && srcMatch[1] && srcMatch[1].startsWith('data:image/')) {
                  try {
                    const node = schema.nodes.image.create({ src: srcMatch[1] });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                    return true;
                  } catch (err) {
                    console.error("Error inserting image from <img> tag", err);
                  }
                }
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

// Extend the default Link extension to support `target="_blank"`
const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      target: {
        default: '_blank',
        parseHTML: element => element.getAttribute('target'),
        renderHTML: attributes => {
          if (!attributes.target) {
            return {};
          }

          return {
            target: attributes.target,
          };
        },
      },
    };
  },
});
  
export default function TipTapEditor({
  content,
  onUpdate,
  onBlur: onBlurCallback,
  getContentRef,
  isEditable = true,
  toolbarVisible = true,
  specialButton = null,
  limitedToolbar = false,
}) {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CustomLink.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      PasteImageExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (hasUserInteracted && onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editable: isEditable,
    immediatelyRender: false,
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
    },
  });

  // Expose getContent so parent can read latest HTML before submit (e.g. Mark as complete)
  useEffect(() => {
    if (!getContentRef || !editor) return;
    getContentRef.current = () => editor.getHTML();
    return () => {
      getContentRef.current = null;
    };
  }, [editor, getContentRef]);

  // Flush latest content to parent when editor blurs; optional parent callback (e.g. persist draft)
  useEffect(() => {
    if (!editor) return;
    const handleBlur = () => {
      if (onUpdate) onUpdate(editor.getHTML());
      onBlurCallback?.();
    };
    editor.on("blur", handleBlur);
    return () => editor.off("blur", handleBlur);
  }, [editor, onUpdate, onBlurCallback]);

  // Set content when editor + content are ready
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content, false); // hydrate without triggering onUpdate
      }
    }
  }, [editor, content]);

  // Set "user has interacted" flag
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
    };
    
    editor.on('transaction', handleTransaction);
    
    return () => {
      editor.off('transaction', handleTransaction);
    };
    
  }, [editor, hasUserInteracted]);


  const Toolbar = () => {
    if (!editor || !toolbarVisible || !isFocused) return null;

    const handleStyleClick = (command, e) => {
      e.preventDefault();
      e.stopPropagation();
      if (editor.isEditable) {
        command();
      }
    };

    const handleLinkClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    
      if (!editor.isEditable) return;
    
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('Enter link URL:', previousUrl);
    
      // Cancelled
      if (url === null) return;
    
      // Empty — remove link
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
    
      // ensure the URL has a protocol (http/https)
      const normalizedUrl = /^(https?:)?\/\//.test(url) ? url : `https://${url}`;
    
      // Add or update link — open in new tab
      editor.chain().focus().extendMarkRange('link').setLink({
        href: normalizedUrl,
        target: '_blank',
      }).run();
    };

    const renderSpecialButton = () => {
      if (!specialButton) return null;

      const {
        label,
        onClick,
        disabled: externalDisabled,
        loading = false,
        icon,
        className = "",
        primary = false,
        positive = false,
        negative = false,
        color,
        colorBackground,
        secondary = false,
        basic = true,
      } = specialButton;

      if (!label || typeof onClick !== "function") {
        return null;
      }

      const isDisabled = !!externalDisabled || !editor.isEditable;

      const handleClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isDisabled) {
          return;
        }
        onClick(editor, event);
      };

      const borderColor = color || "#274E5B";
      const backgroundColor =
        colorBackground !== undefined ? colorBackground : "#FFFFFF";

      const buttonStyle = {
        "--special-button-border": borderColor,
        "--special-button-text": borderColor,
        "--special-button-background": backgroundColor,
        "--special-button-hover-border": backgroundColor,
        "--special-button-hover-text": backgroundColor,
        "--special-button-hover-background": borderColor,
      };

      return (
        <>
          <div
            style={{
              width: "1px",
              background: "#D3E0E3",
              height: "32px",
              alignSelf: "center",
              margin: "0 4px",
            }}
          />
          <div
            className="toolbarGroup specialButtonGroup"
            style={{ marginLeft: "auto" }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              className={`toolbarButton specialToolbarButton ${className}`.trim()}
              onClick={handleClick}
              disabled={isDisabled}
              loading={loading}
              primary={primary}
              positive={positive}
              negative={negative}
              secondary={secondary}
              aria-label={label}
              basic={basic}
              type="button"
              style={buttonStyle}
            >
              {icon && <Icon name={icon} />}
              {label}
            </Button>
          </div>
        </>
      );
    };

    const tableOptions = [
      {
        key: "insert",
        text: "Insert Table",
        value: "insert",
        icon: "table",
        onClick: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
      {
        key: "addColumnBefore",
        text: "Add Column Before",
        value: "addColumnBefore",
        icon: "plus",
        onClick: () => editor.chain().focus().addColumnBefore().run(),
        disabled: !editor.can().addColumnBefore(),
      },
      {
        key: "addColumnAfter",
        text: "Add Column After",
        value: "addColumnAfter",
        icon: "plus",
        onClick: () => editor.chain().focus().addColumnAfter().run(),
        disabled: !editor.can().addColumnAfter(),
      },
      {
        key: "deleteColumn",
        text: "Delete Column",
        value: "deleteColumn",
        icon: "minus",
        onClick: () => editor.chain().focus().deleteColumn().run(),
        disabled: !editor.can().deleteColumn(),
      },
      {
        key: "addRowBefore",
        text: "Add Row Before",
        value: "addRowBefore",
        icon: "plus",
        onClick: () => editor.chain().focus().addRowBefore().run(),
        disabled: !editor.can().addRowBefore(),
      },
      {
        key: "addRowAfter",
        text: "Add Row After",
        value: "addRowAfter",
        icon: "plus",
        onClick: () => editor.chain().focus().addRowAfter().run(),
        disabled: !editor.can().addRowAfter(),
      },
      {
        key: "deleteRow",
        text: "Delete Row",
        value: "deleteRow",
        icon: "minus",
        onClick: () => editor.chain().focus().deleteRow().run(),
        disabled: !editor.can().deleteRow(),
      },
      {
        key: "deleteTable",
        text: "Delete Table",
        value: "deleteTable",
        icon: "trash",
        onClick: () => editor.chain().focus().deleteTable().run(),
        disabled: !editor.can().deleteTable(),
      },
      {
        key: "toggleHeaderColumn",
        text: "Toggle Header Column",
        value: "toggleHeaderColumn",
        icon: "columns",
        onClick: () => editor.chain().focus().toggleHeaderColumn().run(),
        disabled: !editor.can().toggleHeaderColumn(),
      },
      {
        key: "toggleHeaderRow",
        text: "Toggle Header Row",
        value: "toggleHeaderRow",
        icon: "rows",
        onClick: () => editor.chain().focus().toggleHeaderRow().run(),
        disabled: !editor.can().toggleHeaderRow(),
      },
      {
        key: "toggleHeaderCell",
        text: "Toggle Header Cell",
        value: "toggleHeaderCell",
        icon: "square outline",
        onClick: () => editor.chain().focus().toggleHeaderCell().run(),
        disabled: !editor.can().toggleHeaderCell(),
      },
      {
        key: "mergeCells",
        text: "Merge Cells",
        value: "mergeCells",
        icon: "compress",
        onClick: () => editor.chain().focus().mergeCells().run(),
        disabled: !editor.can().mergeCells(),
      },
      {
        key: "splitCell",
        text: "Split Cell",
        value: "splitCell",
        icon: "expand",
        onClick: () => editor.chain().focus().splitCell().run(),
        disabled: !editor.can().splitCell(),
      },
    ];

    // Limited toolbar mode - only show: bold, italic, underline, link, bullet list, ordered list
    if (limitedToolbar) {
      return (
        <div className={`floatingToolbar ${isFocused ? 'visible' : ''}`}>
          <div className="toolbar">
            <div
              className="toolbarGroup"
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
                onClick={handleLinkClick}
                disabled={!editor.isEditable}
                active={editor.isActive("link")}
                aria-label="Insert/edit link"
              >
                <Icon name="linkify" />
              </Button>
              <Button
                icon
                className="toolbarButton"
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleBulletList(), e)
                }
                disabled={!editor.isEditable}
                active={editor.isActive("bulletList")}
                aria-label="Toggle bullet list"
              >
                <Icon name="list ul" />
              </Button>
              <Button
                icon
                className="toolbarButton"
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleOrderedList(), e)
                }
                disabled={!editor.isEditable}
                active={editor.isActive("orderedList")}
                aria-label="Toggle numbered list"
              >
                <Icon name="list ol" />
              </Button>
            </div>
            {renderSpecialButton()}
          </div>
        </div>
      );
    }

    // Full toolbar mode
    return (
      <div className={`floatingToolbar ${isFocused ? 'visible' : ''}`}>
        <div className="toolbar">
          <div
            className="toolbarGroup"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              icon
              className="toolbarButton"
              onClick={(e) =>
                handleStyleClick(() => editor.chain().focus().undo().run(), e)
              }
              disabled={!editor.isEditable || !editor.can().undo()}
              aria-label="Undo"
            >
              <Icon name="undo" />
            </Button>
            <Button
              icon
              className="toolbarButton"
              onClick={(e) =>
                handleStyleClick(() => editor.chain().focus().redo().run(), e)
              }
              disabled={!editor.isEditable || !editor.can().redo()}
              aria-label="Redo"
            >
              <Icon name="redo" />
            </Button>
          </div>
          <div
            style={{
              width: "1px",
              background: "#D3E0E3",
              height: "32px",
              alignSelf: "center",
              margin: "0 4px",
            }}
          />
          <div
            className="toolbarGroup"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Text formatting */}

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
            {/* Link */}
            <Button
              icon
              className="toolbarButton"
              onClick={handleLinkClick}
              disabled={!editor.isEditable}
              active={editor.isActive("link")}
              aria-label="Insert/edit link"
            >
              <Icon name="linkify" />
            </Button>
            </div>
          <div
            style={{
              width: "1px",
              background: "#D3E0E3",
              height: "32px",
              alignSelf: "center",
              margin: "0 4px",
            }}
          />
          <div
            className="toolbarGroup"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              icon
              className="toolbarButton"
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleBulletList(), e)
              }
              disabled={!editor.isEditable}
              active={editor.isActive("bulletList")}
              aria-label="Toggle bullet list"
            >
              <Icon name="list ul" />
            </Button>
            <Button
              icon
              className="toolbarButton"
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleOrderedList(), e)
              }
              disabled={!editor.isEditable}
              active={editor.isActive("orderedList")}
              aria-label="Toggle numbered list"
            >
              <Icon name="list ol" />
            </Button>
            <Button
              icon
              className="toolbarButton"
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleBlockquote(), e)
              }
              disabled={!editor.isEditable}
              active={editor.isActive("blockquote")}
              aria-label="Toggle blockquote"
            >
              <Icon name="quote left" />
            </Button>
          </div>
          <div
            style={{
              width: "1px",
              background: "#D3E0E3",
              height: "32px",
              alignSelf: "center",
              margin: "0 4px",
            }}
          />
          <div
            className="toolbarGroup"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            
            {/* Image */}
            <Button
              icon
              className="toolbarButton"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = window.prompt('Enter image URL or paste base64 data:');
                if (url && editor.isEditable) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              disabled={!editor.isEditable}
              aria-label="Insert image"
            >
              <Icon name="image" />
            </Button>
            
            <Dropdown
              trigger={
                <Button
                  icon
                  className="toolbarButton"
                  disabled={!editor.isEditable}
                  active={editor.isActive("table")}
                  aria-label="Table options"
                >
                  <Icon name="table" />
                </Button>
              }
              pointing
              className="table-dropdown"
              disabled={!editor.isEditable}
            >
              <Dropdown.Menu>
                {tableOptions.map((option) => (
                  <Dropdown.Item
                    key={option.key}
                    icon={option.icon}
                    text={option.text}
                    disabled={option.disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      option.onClick();
                    }}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        {renderSpecialButton()}
        </div>
      </div>
    );
  };

  return (
    <StyledTipTap ref={editorRef}>
      <div className="editorContainer">
        <EditorContent 
          editor={editor} 
          className="tiptapEditor" 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Toolbar />
      </div>
    </StyledTipTap>
  );
}