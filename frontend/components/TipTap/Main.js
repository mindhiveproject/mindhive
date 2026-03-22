"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState, useRef, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Button, Dropdown } from "semantic-ui-react";
import { useApolloClient } from "@apollo/client";

import DesignSystemButton from "../DesignSystem/Button";
import { StyledTipTap } from "./StyledTipTap";
import { PasteImageExtension } from "./pasteImageExtension";
import MediaLibraryModal from "./MediaLibraryModal";
import { MindHiveImage } from "./mindHiveImage";
import {
  CREATE_MEDIA_ASSET,
  buildMediaAssetCreateData,
} from "../Mutations/MediaAsset";
import { uploadMediaImageToCloudinary } from "../../lib/cloudinaryMediaUpload";

const TIPTAP_ICONS_BASE = "/assets/tiptapIcons";

function TipTapToolbarIcon({ file, width = 18, height = 18 }) {
  return (
    <img
      src={`${TIPTAP_ICONS_BASE}/${file}.svg`}
      alt=""
      width={width}
      height={height}
      className="tiptap-toolbar-icon"
      draggable={false}
    />
  );
}

// 24×24 checkmark for special toolbar button (e.g. "Saved"); uses currentColor
const CHECK_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
  </svg>
);

const MEDIA_LIBRARY_ICON = <TipTapToolbarIcon file="imagePlus" width={20} height={20} />;

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
  mediaLibraryId = null,
  mediaLibrarySource = null,
  mediaDisplayedInProposalCardId = null,
}) {
  const { t } = useTranslation("builder");
  const apolloClient = useApolloClient();
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mediaLibraryModalOpen, setMediaLibraryModalOpen] = useState(false);
  const editorRef = useRef(null);
  const pasteImageContextRef = useRef({});
  pasteImageContextRef.current = {
    onPasteImageNoMediaScope: () =>
      window.alert(
        t(
          "tiptap.pasteImageNoMediaScope",
          "Pasting images is not available here. Use the image button and enter an image URL.",
        ),
      ),
    onPasteImageUploadFailed: () =>
      window.alert(
        t(
          "tiptap.pasteImageUploadFailed",
          "Could not upload the pasted image. Check your connection and try again.",
        ),
      ),
    mediaScopeId: mediaLibraryId || null,
    uploadPastedImage: async (file) => {
      const scopeId = mediaLibraryId;
      if (!scopeId || !file) return null;
      const { secureUrl, publicId } = await uploadMediaImageToCloudinary(
        file,
        scopeId,
      );
      const baseName = file.name.replace(/\.[^.]+$/, "") || "";
      const createData = buildMediaAssetCreateData({
        scopeId,
        fileName: baseName,
        url: secureUrl,
        publicId,
        mediaLibrarySource,
        mediaCreatedWithOverride: "paste",
        mediaDisplayedInProposalCardId,
      });
      const { data } = await apolloClient.mutate({
        mutation: CREATE_MEDIA_ASSET,
        variables: { data: createData },
      });
      const row = data?.createMediaAsset;
      if (!row?.id || !row?.url) return null;
      return { id: row.id, url: row.url };
    },
  };

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      CustomLink.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      MindHiveImage.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      PasteImageExtension.configure({
        getPasteContext: () => pasteImageContextRef.current,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
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
  }, [extensions]);

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

      const leadingIcon = icon === "check" ? CHECK_ICON : null;

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
            <DesignSystemButton
              variant="tonal"
              onClick={handleClick}
              disabled={isDisabled}
              type="button"
              leadingIcon={leadingIcon}
              aria-label={label}
              className={className.trim() || undefined}
            >
              {label}
            </DesignSystemButton>
          </div>
        </>
      );
    };

    const tableOptions = [
      {
        key: "insert",
        text: "Insert Table",
        value: "insert",
        iconSrc: `${TIPTAP_ICONS_BASE}/table.svg`,
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
        onClick: () => editor.chain().focus().addColumnBefore().run(),
        disabled: !editor.can().addColumnBefore(),
      },
      {
        key: "addColumnAfter",
        text: "Add Column After",
        value: "addColumnAfter",
        onClick: () => editor.chain().focus().addColumnAfter().run(),
        disabled: !editor.can().addColumnAfter(),
      },
      {
        key: "deleteColumn",
        text: "Delete Column",
        value: "deleteColumn",
        onClick: () => editor.chain().focus().deleteColumn().run(),
        disabled: !editor.can().deleteColumn(),
      },
      {
        key: "addRowBefore",
        text: "Add Row Before",
        value: "addRowBefore",
        onClick: () => editor.chain().focus().addRowBefore().run(),
        disabled: !editor.can().addRowBefore(),
      },
      {
        key: "addRowAfter",
        text: "Add Row After",
        value: "addRowAfter",
        onClick: () => editor.chain().focus().addRowAfter().run(),
        disabled: !editor.can().addRowAfter(),
      },
      {
        key: "deleteRow",
        text: "Delete Row",
        value: "deleteRow",
        onClick: () => editor.chain().focus().deleteRow().run(),
        disabled: !editor.can().deleteRow(),
      },
      {
        key: "deleteTable",
        text: "Delete Table",
        value: "deleteTable",
        onClick: () => editor.chain().focus().deleteTable().run(),
        disabled: !editor.can().deleteTable(),
      },
      {
        key: "toggleHeaderColumn",
        text: "Toggle Header Column",
        value: "toggleHeaderColumn",
        onClick: () => editor.chain().focus().toggleHeaderColumn().run(),
        disabled: !editor.can().toggleHeaderColumn(),
      },
      {
        key: "toggleHeaderRow",
        text: "Toggle Header Row",
        value: "toggleHeaderRow",
        onClick: () => editor.chain().focus().toggleHeaderRow().run(),
        disabled: !editor.can().toggleHeaderRow(),
      },
      {
        key: "toggleHeaderCell",
        text: "Toggle Header Cell",
        value: "toggleHeaderCell",
        onClick: () => editor.chain().focus().toggleHeaderCell().run(),
        disabled: !editor.can().toggleHeaderCell(),
      },
      {
        key: "mergeCells",
        text: "Merge Cells",
        value: "mergeCells",
        onClick: () => editor.chain().focus().mergeCells().run(),
        disabled: !editor.can().mergeCells(),
      },
      {
        key: "splitCell",
        text: "Split Cell",
        value: "splitCell",
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
                <TipTapToolbarIcon file="bold" />
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
                <TipTapToolbarIcon file="italics" />
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
                <TipTapToolbarIcon file="underline" />
              </Button>
              <Button
                icon
                className="toolbarButton"
                onClick={handleLinkClick}
                disabled={!editor.isEditable}
                active={editor.isActive("link")}
                aria-label="Insert/edit link"
              >
                <TipTapToolbarIcon file="link" />
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
                <TipTapToolbarIcon file="bulletList" />
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
                <TipTapToolbarIcon file="numberedList" />
              </Button>
              {mediaLibraryId && (
                <Button
                  className="toolbarButton"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMediaLibraryModalOpen(true);
                  }}
                  disabled={!editor.isEditable}
                  aria-label={t(
                    "tiptap.mediaLibraryAria",
                    "Open media library",
                  )}
                >
                  {MEDIA_LIBRARY_ICON}
                </Button>
              )}
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
              <TipTapToolbarIcon file="undo" />
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
              <TipTapToolbarIcon file="redo" />
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
              <TipTapToolbarIcon file="h1" />
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
              <TipTapToolbarIcon file="bold" />
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
              <TipTapToolbarIcon file="italics" />
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
              <TipTapToolbarIcon file="underline" />
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
              <TipTapToolbarIcon file="link" />
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
              <TipTapToolbarIcon file="bulletList" />
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
              <TipTapToolbarIcon file="numberedList" />
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
              <TipTapToolbarIcon file="quotes" />
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
            
            {/* Image: URL only when no board media scope (e.g. assignments) */}
            {!mediaLibraryId && (
              <Button
                icon
                className="toolbarButton"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = window.prompt(
                    t(
                      "tiptap.insertImagePrompt",
                      "Enter image URL:",
                    ),
                  );
                  if (url && editor.isEditable) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
                disabled={!editor.isEditable}
                aria-label={t("tiptap.insertImageAria", "Insert image")}
              >
                <TipTapToolbarIcon file="imagePlus" />
              </Button>
            )}
            {mediaLibraryId && (
              <Button
                className="toolbarButton"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMediaLibraryModalOpen(true);
                }}
                disabled={!editor.isEditable}
                aria-label={t(
                  "tiptap.mediaLibraryAria",
                  "Open media library",
                )}
              >
                {MEDIA_LIBRARY_ICON}
              </Button>
            )}
            <Dropdown
              trigger={
                <Button
                  icon
                  className="toolbarButton"
                  disabled={!editor.isEditable}
                  active={editor.isActive("table")}
                  aria-label="Table options"
                >
                  <TipTapToolbarIcon file="table" />
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
                    disabled={option.disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      option.onClick();
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {option.iconSrc ? (
                        <img
                          src={option.iconSrc}
                          alt=""
                          width={18}
                          height={18}
                          style={{ flexShrink: 0 }}
                          draggable={false}
                        />
                      ) : null}
                      {option.text}
                    </span>
                  </Dropdown.Item>
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
    <>
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
      {mediaLibraryId && (
        <MediaLibraryModal
          open={mediaLibraryModalOpen}
          onClose={() => setMediaLibraryModalOpen(false)}
          mediaScopeId={mediaLibraryId}
          mediaLibrarySource={mediaLibrarySource}
          mediaDisplayedInProposalCardId={mediaDisplayedInProposalCardId}
          onInsertMedia={({ id, url }) => {
            if (url && editor?.isEditable) {
              editor
                .chain()
                .focus()
                .setImage({
                  src: url,
                  ...(id ? { mediaAssetId: id } : {}),
                })
                .run();
            }
          }}
        />
      )}
    </>
  );
}