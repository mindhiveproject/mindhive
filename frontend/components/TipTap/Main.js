"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState } from "react";
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
  isEditable = true,
  toolbarVisible = true,
}) {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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
  });

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
    if (!editor || !toolbarVisible) return null;

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

    return (
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