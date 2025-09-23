"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
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

            // Check for text content that might be a base64 image (img tag or data URI)
            const text = clipboardData.getData('text/plain');
            if (text && text.match(/^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/)) {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: text });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default function TipTapEditor({
  content,
  onUpdate,
  isEditable = true,
  toolbarVisible = true,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
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
    );
  };

  return (
    <StyledTipTap>
      <Toolbar />
      <EditorContent editor={editor} className="tiptapEditor" />
    </StyledTipTap>
  );
}