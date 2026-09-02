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
import Collaboration from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useApolloClient } from "@apollo/client";

import CollaborationCursorExtension from "./CollaborationCursorExtension";
import { collabWsUrl } from "../../config";

import DesignSystemButton from "../DesignSystem/Button";
import CompactActionButton from "../DesignSystem/CompactActionButton";
import DropdownMenu from "../DesignSystem/DropdownMenu";
import { StyledTipTap } from "./StyledTipTap";
import { PasteImageExtension } from "./pasteImageExtension";
import MediaLibraryModal from "./MediaLibraryModal";
import { MindHiveImage } from "./mindHiveImage";
import {
  CREATE_MEDIA_ASSET,
  buildMediaAssetCreateData,
  resolveMediaAssetUrl,
} from "../Mutations/MediaAsset";

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

function TipTapToolbarButton({
  icon,
  onClick,
  disabled = false,
  selected = false,
  ariaLabel,
}) {
  return (
    <CompactActionButton
      kind="ghost"
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      selected={selected}
      ariaLabel={ariaLabel}
      aria-pressed={selected}
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
  
// ── Collaborative editing helpers ─────────────────────────────────────────────

// The collaboration WebSocket URL is resolved centrally in config.js so it
// always tracks the same backend origin Apollo talks to — pointing them at
// different servers would edit a different database than the one the card
// content (yjsState) lives in.
function getCollaborationUrl() {
  return collabWsUrl;
}

// Mirrors the server-side cursor colour assignment (keystone/lib/hocuspocus.ts).
const CURSOR_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#f59e0b",
  "#3b82f6",
];

function getUserColor(userId) {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function TipTapEditor(props) {
  const collabDocumentName = props.collaboration?.documentName || null;
  const collabField = props.collaboration?.field || null;
  const [provider, setProvider] = useState(null);
  const [collabSynced, setCollabSynced] = useState(false);

  // Connect first; only bind Collaboration after the document has synced.
  // If the collab server is down, we keep a normal HTML editor so Save and
  // reload still work from the HTML columns.
  useEffect(() => {
    if (!collabDocumentName || !collabField) {
      setProvider(null);
      setCollabSynced(false);
      return undefined;
    }
    const p = new HocuspocusProvider({
      url: getCollaborationUrl(),
      name: collabDocumentName,
      // Auth travels with the session cookie on the WS upgrade — no token needed.
      token: "",
    });
    setProvider(p);
    const markSynced = () => setCollabSynced(true);
    if (p.synced) markSynced();
    p.on("synced", markSynced);
    return () => {
      p.off("synced", markSynced);
      p.destroy();
      setProvider(null);
      setCollabSynced(false);
    };
  }, [collabDocumentName, collabField]);

  const collabReady = !!(provider && collabSynced);

  return (
    <TipTapEditorInner
      key={collabReady ? "collab" : "html"}
      {...props}
      provider={collabReady ? provider : null}
      collabDocumentName={collabReady ? collabDocumentName : null}
      collabField={collabReady ? collabField : null}
    />
  );
}

function TipTapEditorInner({
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
  usedInVizSectionIds = null,
  /** When set, shown over the editor while the document is empty (pointer-events: none). */
  emptyInvite = null,
  floatingToolbarTop = null,
  floatingToolbarAutoOffset = false,
  collaborationUser = null,
  provider = null,
  collabDocumentName = null,
  collabField = null,
}) {
  const { t } = useTranslation("builder");
  const apolloClient = useApolloClient();
  const [isFocused, setIsFocused] = useState(false);
  const [docEmpty, setDocEmpty] = useState(true);
  const [mediaLibraryModalOpen, setMediaLibraryModalOpen] = useState(false);
  const [computedFloatingToolbarTop, setComputedFloatingToolbarTop] = useState(null);
  const editorRef = useRef(null);
  const editorHostRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);
  const onBlurCallbackRef = useRef(onBlurCallback);
  onUpdateRef.current = onUpdate;
  onBlurCallbackRef.current = onBlurCallback;
  // Keep the original HTML for first-load seeding even if a parent briefly
  // passes an empty `content` after a stale onUpdate.
  const contentSeedRef = useRef(content);
  if (content) {
    contentSeedRef.current = content;
  }

  // Guards one-time seeding of an empty shared document from the initial HTML.
  const collabSeededRef = useRef(false);
  useEffect(() => {
    collabSeededRef.current = false;
  }, [collabDocumentName, collabField]);

  // One Hocuspocus provider per collaborative editor instance (created by the
  // wrapper). Multiple editors on the same card share the server-side Yjs doc
  // (same documentName) but bind different named fragments via `field`.
  const collabEnabled = !!(provider && collabField);

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
      const baseName = file.name.replace(/\.[^.]+$/, "") || "";
      const createData = buildMediaAssetCreateData({
        scopeId,
        fileName: baseName,
        mediaLibrarySource,
        mediaCreatedWithOverride: "paste",
        mediaDisplayedInProposalCardId,
        usedInVizSectionIds,
      });
      createData.image = { upload: file };
      const { data } = await apolloClient.mutate({
        mutation: CREATE_MEDIA_ASSET,
        variables: { data: createData },
      });
      const row = data?.createMediaAsset;
      const resolvedUrl = resolveMediaAssetUrl(row);
      if (!row?.id || !resolvedUrl) return null;
      return { id: row.id, url: resolvedUrl };
    },
  };

  const collabUserId = collaborationUser?.id || null;
  const collabUserName = collaborationUser?.name || "Editor";
  const collabUserColor = getUserColor(collabUserId);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        underline: false,
        // Yjs provides shared undo/redo history; StarterKit's UndoRedo extension
        // must be disabled when collaboration is on or the two conflict. (In
        // TipTap v3 this option is `undoRedo`, renamed from v2's `history`.)
        ...(collabEnabled ? { undoRedo: false } : {}),
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
      ...(collabEnabled
        ? [
            Collaboration.configure({
              document: provider.document,
              field: collabField,
            }),
            CollaborationCursorExtension.configure({
              provider,
              user: { name: collabUserName, color: collabUserColor },
            }),
          ]
        : []),
    ],
    [collabEnabled, provider, collabField, collabUserName, collabUserColor],
  );

  const emitHtmlToParent = (html) => {
    onUpdateRef.current?.(html);
  };

  const editor = useEditor({
    extensions,
    content: "",
    onUpdate: ({ editor }) => {
      emitHtmlToParent(editor.getHTML());
    },
    editable: isEditable,
    immediatelyRender: false,
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
    },
  }, [extensions]);

  // Expose getContent so parent can read latest HTML before submit (e.g. Mark as complete)
  if (getContentRef) {
    getContentRef.current = editor ? () => editor.getHTML() : getContentRef.current;
  }
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
      emitHtmlToParent(editor.getHTML());
      onBlurCallbackRef.current?.();
    };
    editor.on("blur", handleBlur);
    return () => editor.off("blur", handleBlur);
  }, [editor]);

  // Set content when editor + content are ready.
  // In collaborative mode Yjs owns the document — never hydrate from the `content`
  // prop here, or we'd duplicate the shared content into the local fragment.
  useEffect(() => {
    if (collabEnabled) return;
    if (editor && content) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        // hydrate without triggering onUpdate (v3 options-object signature)
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [editor, content, collabEnabled]);

  // Collaborative first-load seeding. The server keeps no DOM and never converts
  // HTML, so when a card is opened for the very first time (no yjsState yet) the
  // shared document is empty. The browser seeds it once from the card's existing
  // HTML so the content appears and becomes the CRDT baseline. If yjsState (or a
  // peer's edits) already populated the doc, we skip seeding.
  // Note: if two clients open a never-edited card at the exact same moment they
  // could both seed and duplicate it — rare in practice (the author edits first;
  // peers join once yjsState exists).
  useEffect(() => {
    if (!collabEnabled || !editor || !provider) return undefined;
    if (collabSeededRef.current) return undefined;

    const trySeed = () => {
      if (collabSeededRef.current) return;
      if (!provider.synced) return; // wait for the initial sync
      if (!editor.isEmpty) {
        // yjsState or a peer already provided content — nothing to seed.
        // Still push HTML to the parent so Save writes the live document,
        // not an empty ref from before sync.
        collabSeededRef.current = true;
        emitHtmlToParent(editor.getHTML());
        return;
      }
      const seedHtml = contentSeedRef.current;
      if (!seedHtml) return; // initial HTML not available yet; retry on change
      editor.commands.setContent(seedHtml, { emitUpdate: true });
      collabSeededRef.current = true;
    };

    trySeed();
    if (!provider.synced) {
      provider.on("synced", trySeed);
      return () => provider.off("synced", trySeed);
    }
    return undefined;
  }, [collabEnabled, editor, provider, content]);

  // Keep empty-state invite in sync with document (e.g. paragraph panel).
  useEffect(() => {
    if (!editor || !emptyInvite) return;
    const sync = () => setDocEmpty(editor.isEmpty);
    sync();
    editor.on("update", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("update", sync);
      editor.off("transaction", sync);
    };
  }, [editor, emptyInvite]);


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
      const url = window.prompt(
        t("tiptap.linkPrompt", {}, { default: "Enter link URL:" }),
        previousUrl,
      );
    
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
        label: t("tiptap.toolbar.tableInsert", {}, { default: "Insert Table" }),
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
        label: t("tiptap.toolbar.tableAddColumnBefore", {}, { default: "Add Column Before" }),
        onClick: () => editor.chain().focus().addColumnBefore().run(),
        disabled: !editor.can().addColumnBefore(),
      },
      {
        key: "addColumnAfter",
        label: t("tiptap.toolbar.tableAddColumnAfter", {}, { default: "Add Column After" }),
        onClick: () => editor.chain().focus().addColumnAfter().run(),
        disabled: !editor.can().addColumnAfter(),
      },
      {
        key: "deleteColumn",
        label: t("tiptap.toolbar.tableDeleteColumn", {}, { default: "Delete Column" }),
        onClick: () => editor.chain().focus().deleteColumn().run(),
        disabled: !editor.can().deleteColumn(),
      },
      {
        key: "addRowBefore",
        label: t("tiptap.toolbar.tableAddRowBefore", {}, { default: "Add Row Before" }),
        onClick: () => editor.chain().focus().addRowBefore().run(),
        disabled: !editor.can().addRowBefore(),
      },
      {
        key: "addRowAfter",
        label: t("tiptap.toolbar.tableAddRowAfter", {}, { default: "Add Row After" }),
        onClick: () => editor.chain().focus().addRowAfter().run(),
        disabled: !editor.can().addRowAfter(),
      },
      {
        key: "deleteRow",
        label: t("tiptap.toolbar.tableDeleteRow", {}, { default: "Delete Row" }),
        onClick: () => editor.chain().focus().deleteRow().run(),
        disabled: !editor.can().deleteRow(),
      },
      {
        key: "deleteTable",
        label: t("tiptap.toolbar.tableDeleteTable", {}, { default: "Delete Table" }),
        onClick: () => editor.chain().focus().deleteTable().run(),
        disabled: !editor.can().deleteTable(),
      },
      {
        key: "toggleHeaderColumn",
        label: t("tiptap.toolbar.tableToggleHeaderColumn", {}, { default: "Toggle Header Column" }),
        onClick: () => editor.chain().focus().toggleHeaderColumn().run(),
        disabled: !editor.can().toggleHeaderColumn(),
      },
      {
        key: "toggleHeaderRow",
        label: t("tiptap.toolbar.tableToggleHeaderRow", {}, { default: "Toggle Header Row" }),
        onClick: () => editor.chain().focus().toggleHeaderRow().run(),
        disabled: !editor.can().toggleHeaderRow(),
      },
      {
        key: "toggleHeaderCell",
        label: t("tiptap.toolbar.tableToggleHeaderCell", {}, { default: "Toggle Header Cell" }),
        onClick: () => editor.chain().focus().toggleHeaderCell().run(),
        disabled: !editor.can().toggleHeaderCell(),
      },
      {
        key: "mergeCells",
        label: t("tiptap.toolbar.tableMergeCells", {}, { default: "Merge Cells" }),
        onClick: () => editor.chain().focus().mergeCells().run(),
        disabled: !editor.can().mergeCells(),
      },
      {
        key: "splitCell",
        label: t("tiptap.toolbar.tableSplitCell", {}, { default: "Split Cell" }),
        onClick: () => editor.chain().focus().splitCell().run(),
        disabled: !editor.can().splitCell(),
      },
    ];

    const tableMenuItems = tableOptions.map((option) => ({
      key: option.key,
      label: option.label,
      icon: option.iconSrc ? (
        <img
          src={option.iconSrc}
          alt=""
          width={18}
          height={18}
          style={{ flexShrink: 0 }}
          draggable={false}
        />
      ) : null,
      onClick: option.disabled ? undefined : option.onClick,
      static: option.disabled,
    }));

    // Limited toolbar mode - only show: bold, italic, underline, link, bullet list, ordered list
    if (limitedToolbar) {
      return (
        <div className={`floatingToolbar ${isFocused ? "visible" : ""}`}>
          <div className="toolbar">
            <div
              className="toolbarGroup"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="bold" />}
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleBold(), e)
                }
                disabled={!editor.isEditable}
                selected={editor.isActive("bold")}
                ariaLabel={t("tiptap.toolbar.toggleBold", {}, { default: "Toggle bold" })}
              />
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="italics" />}
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleItalic(), e)
                }
                disabled={!editor.isEditable}
                selected={editor.isActive("italic")}
                ariaLabel={t("tiptap.toolbar.toggleItalic", {}, { default: "Toggle italic" })}
              />
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="underline" />}
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleUnderline(), e)
                }
                disabled={!editor.isEditable}
                selected={editor.isActive("underline")}
                ariaLabel={t("tiptap.toolbar.toggleUnderline", {}, { default: "Toggle underline" })}
              />
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="link" />}
                onClick={handleLinkClick}
                disabled={!editor.isEditable}
                selected={editor.isActive("link")}
                ariaLabel={t("tiptap.toolbar.insertLink", {}, { default: "Insert/edit link" })}
              />
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="bulletList" />}
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleBulletList(), e)
                }
                disabled={!editor.isEditable}
                selected={editor.isActive("bulletList")}
                ariaLabel={t("tiptap.toolbar.toggleBulletList", {}, { default: "Toggle bullet list" })}
              />
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="numberedList" />}
                onClick={(e) =>
                  handleStyleClick(() => editor.commands.toggleOrderedList(), e)
                }
                disabled={!editor.isEditable}
                selected={editor.isActive("orderedList")}
                ariaLabel={t("tiptap.toolbar.toggleNumberedList", {}, { default: "Toggle numbered list" })}
              />
              {mediaLibraryId && (
                <TipTapToolbarButton
                  icon={MEDIA_LIBRARY_ICON}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMediaLibraryModalOpen(true);
                  }}
                  disabled={!editor.isEditable}
                  ariaLabel={t(
                    "tiptap.mediaLibraryAria",
                    {},
                    { default: "Open media library" },
                  )}
                />
              )}
            </div>
            {renderSpecialButton()}
          </div>
        </div>
      );
    }

    // Full toolbar mode
    return (
      <div className={`floatingToolbar ${isFocused ? "visible" : ""}`}>
        <div className="toolbar">
          <div
            className="toolbarGroup"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="undo" />}
              onClick={(e) =>
                handleStyleClick(() => editor.chain().focus().undo().run(), e)
              }
              disabled={!editor.isEditable || !editor.can().undo()}
              ariaLabel={t("tiptap.toolbar.undo", {}, { default: "Undo" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="redo" />}
              onClick={(e) =>
                handleStyleClick(() => editor.chain().focus().redo().run(), e)
              }
              disabled={!editor.isEditable || !editor.can().redo()}
              ariaLabel={t("tiptap.toolbar.redo", {}, { default: "Redo" })}
            />
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

            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="h1" />}
              onClick={(e) =>
                handleStyleClick(
                  () => editor.commands.toggleHeading({ level: 1 }),
                  e
                )
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("heading", { level: 1 })}
              ariaLabel={t("tiptap.toolbar.toggleHeading1", {}, { default: "Toggle heading 1" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="bold" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleBold(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("bold")}
              ariaLabel={t("tiptap.toolbar.toggleBold", {}, { default: "Toggle bold" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="italics" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleItalic(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("italic")}
              ariaLabel={t("tiptap.toolbar.toggleItalic", {}, { default: "Toggle italic" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="underline" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleUnderline(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("underline")}
              ariaLabel={t("tiptap.toolbar.toggleUnderline", {}, { default: "Toggle underline" })}
            />
            {/* Link */}
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="link" />}
              onClick={handleLinkClick}
              disabled={!editor.isEditable}
              selected={editor.isActive("link")}
              ariaLabel={t("tiptap.toolbar.insertLink", {}, { default: "Insert/edit link" })}
            />
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
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="bulletList" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleBulletList(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("bulletList")}
              ariaLabel={t("tiptap.toolbar.toggleBulletList", {}, { default: "Toggle bullet list" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="numberedList" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleOrderedList(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("orderedList")}
              ariaLabel={t("tiptap.toolbar.toggleNumberedList", {}, { default: "Toggle numbered list" })}
            />
            <TipTapToolbarButton
              icon={<TipTapToolbarIcon file="quotes" />}
              onClick={(e) =>
                handleStyleClick(() => editor.commands.toggleBlockquote(), e)
              }
              disabled={!editor.isEditable}
              selected={editor.isActive("blockquote")}
              ariaLabel={t("tiptap.toolbar.toggleBlockquote", {}, { default: "Toggle blockquote" })}
            />
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
              <TipTapToolbarButton
                icon={<TipTapToolbarIcon file="imagePlus" />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = window.prompt(
                    t(
                      "tiptap.insertImagePrompt",
                      {},
                      { default: "Enter image URL:" },
                    ),
                  );
                  if (url && editor.isEditable) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
                disabled={!editor.isEditable}
                ariaLabel={t("tiptap.insertImageAria", {}, { default: "Insert image" })}
              />
            )}
            {mediaLibraryId && (
              <TipTapToolbarButton
                icon={MEDIA_LIBRARY_ICON}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMediaLibraryModalOpen(true);
                }}
                disabled={!editor.isEditable}
                ariaLabel={t(
                  "tiptap.mediaLibraryAria",
                  {},
                  { default: "Open media library" },
                )}
              />
            )}
            <DropdownMenu
              ariaLabel={t("tiptap.toolbar.tableOptions", {}, { default: "Table options" })}
              items={tableMenuItems}
              renderTrigger={({ onClick, open, ariaLabel: triggerAriaLabel }) => (
                <TipTapToolbarButton
                  icon={<TipTapToolbarIcon file="table" />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick();
                  }}
                  disabled={!editor.isEditable}
                  selected={open || editor.isActive("table")}
                  ariaLabel={triggerAriaLabel}
                />
              )}
            />
          </div>
        {renderSpecialButton()}
        </div>
      </div>
    );
  };

  const handleEditorHostMouseDown = (event) => {
    if (!editor || !editor.isEditable) return;
    if (event.target.closest(".ProseMirror")) return;
    event.preventDefault();
    editor.chain().focus().run();
  };

  useEffect(() => {
    if (!floatingToolbarAutoOffset || !toolbarVisible) return;

    const resolveToolbarTop = (width) => {
      if (width <= TOOLBAR_WIDTH_BREAKPOINTS.narrowMax) {
        return TOOLBAR_TOP_BY_WIDTH.narrow;
      }
      if (width <= TOOLBAR_WIDTH_BREAKPOINTS.mediumMax) {
        return TOOLBAR_TOP_BY_WIDTH.medium;
      }
      return TOOLBAR_TOP_BY_WIDTH.wide;
    };

    const updateOffsetFromWidth = () => {
      const hostWidth = editorHostRef.current?.getBoundingClientRect?.().width;
      const width = hostWidth || window.innerWidth;
      setComputedFloatingToolbarTop(resolveToolbarTop(width));
    };

    updateOffsetFromWidth();
    window.addEventListener("resize", updateOffsetFromWidth);

    return () => {
      window.removeEventListener("resize", updateOffsetFromWidth);
    };
  }, [floatingToolbarAutoOffset, toolbarVisible]);

  return (
    <>
      <StyledTipTap
        ref={editorRef}
        style={{
          ...(floatingToolbarTop
            ? { "--tiptap-floating-toolbar-top": floatingToolbarTop }
            : {}),
          ...(floatingToolbarAutoOffset && computedFloatingToolbarTop
            ? {
                "--tiptap-floating-toolbar-top": computedFloatingToolbarTop,
              }
            : {}),
        }}
      >
        <div className="editorContainer">
          <div
            ref={editorHostRef}
            className="tiptapEditorHost"
            onMouseDown={handleEditorHostMouseDown}
          >
            <EditorContent
              editor={editor}
              className="tiptapEditor"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {emptyInvite && editor && docEmpty && !isFocused ? (
              <div className="tiptapEmptyInvite" role="note">
                {emptyInvite}
              </div>
            ) : null}
          </div>
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
          usedInVizSectionIds={usedInVizSectionIds}
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