"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import MonacoEditor from "../../../Builder/Project/DataJournal/Helpers/MonacoPythonEditor";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import Modal from "../../../DesignSystem/Modal";
import PanelHeader from "../../../DesignSystem/PanelHeader";
import Popover from "../../../DesignSystem/Popover";
import {
  AddIcon,
  CloseIcon,
  DownloadIcon,
  TerminalIcon,
} from "../../../DesignSystem/Icons";
import Panel from "../Panel";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const STRIP_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  flexShrink: 0,
  padding: "0 16px 12px",
};

const EDITOR_WRAP_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  // Monaco lays out to whatever box it is given and will happily report a
  // content width wider than the panel. Without this the pane inherits that as
  // its minimum and stops being able to shrink.
  minWidth: 0,
  overflow: "hidden",
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

// On top of the Data Journal defaults, which are tuned for a short Python cell.
// A sketch is a whole file the author lives in, so the editing affordances
// Monaco is worth having for — completion, bracket pairs, the find widget's
// seeded search — are all turned back on.
const EDITOR_OPTIONS = {
  quickSuggestions: true,
  wordBasedSuggestions: "currentDocument",
  bracketPairColorization: { enabled: true },
  find: { seedSearchStringFromSelection: "selection" },
  tabSize: 2,
};

const ANCHOR_STYLE = { position: "relative", display: "inline-flex" };

const BADGE_STYLE = {
  position: "absolute",
  top: -2,
  right: -2,
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 9,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Inter, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "18px",
  color: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  pointerEvents: "none",
};

const CONSOLE_BODY_STYLE = {
  minHeight: 0,
  overflowY: "auto",
  padding: "0 16px 16px",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  fontSize: 12,
  lineHeight: "18px",
};

const FILENAME_STYLE = {
  margin: 0,
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  fontSize: 13,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const LOG_STYLE = {
  padding: "4px 0",
  borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

/**
 * The Code tab: a file strip and the editor for whichever file is selected.
 *
 * `parameters.js` is pinned first but is *not* selected by default. The
 * declaration is the contract the Parameters tab renders from, so it has to be
 * reachable and editable — but the file an author opens the tab to work on is
 * the sketch.
 */
export default function CodePanel() {
  const { t } = useTranslation("visuals");
  const {
    files,
    updateFile,
    addFile,
    removeFile,
    canEdit,
    focusFileId,
    logs,
    clearLogs,
  } = useVisualBuilder();

  const [selectedId, setSelectedId] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  // The file the delete modal is asking about, or null when it is closed.
  const [pendingDelete, setPendingDelete] = useState(null);
  const consoleAnchor = useRef(null);

  const ordered = [
    ...files.filter((file) => file.role === "parameters"),
    ...files.filter((file) => file.role !== "parameters"),
  ];
  const entry = files.find((file) => file.role === "entry");
  const selected =
    ordered.find((file) => file.id === selectedId) || entry || ordered[0];

  // The declaration and the sketch are the visual's contract — the Parameters
  // tab reads one and the runtime runs the other — so neither can be removed.
  // Anything else can, including a second file claiming the same role.
  const contract = new Set(
    [
      files.find((file) => file.role === "parameters")?.id,
      entry?.id,
    ].filter(Boolean),
  );

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
  }, [selectedId, selected]);

  // Another panel asked for a specific file — adding a parameter, or the
  // "edit in code" jump from a parameter's settings.
  useEffect(() => {
    if (focusFileId) setSelectedId(focusFileId);
  }, [focusFileId]);

  const closeConsole = useCallback(() => setConsoleOpen(false), []);

  const create = async (name) => {
    setAddOpen(false);
    const created = await addFile(name);
    if (created) setSelectedId(created.id);
  };

  const confirmDelete = () => {
    const file = pendingDelete;
    setPendingDelete(null);
    if (file.id === selectedId) setSelectedId(null);
    removeFile(file.id);
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([selected.content || ""], { type: "text/javascript" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = selected.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!selected) {
    return (
      <Panel title={t("code", "Code")}>
        <p style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
          {t("preparingFiles", "Preparing this visual's files…")}
        </p>
      </Panel>
    );
  }

  const errorCount = logs.filter((log) => log.kind === "error").length;
  const consoleLabel = t("console", "Console");

  return (
    <Panel
      flush
      title={t("code", "Code")}
      actions={
        <>
          <IconButton
            variant="subtle"
            icon={<DownloadIcon />}
            ariaLabel={t("downloadFile", "Download this file")}
            title={t("downloadFile", "Download this file")}
            onClick={download}
          />
          <span ref={consoleAnchor} style={ANCHOR_STYLE}>
            <IconButton
              variant="subtle"
              icon={<TerminalIcon />}
              ariaLabel={consoleLabel}
              title={consoleLabel}
              aria-expanded={consoleOpen}
              aria-haspopup="dialog"
              onClick={() => setConsoleOpen((open) => !open)}
            />
            {logs.length ? (
              <span
                style={{
                  ...BADGE_STYLE,
                  background: errorCount
                    ? "var(--MH-Theme-Warning-Base, #b9261a)"
                    : "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
                }}
              >
                {logs.length === 50 ? "50+" : logs.length}
              </span>
            ) : null}
          </span>
        </>
      }
    >
      <div style={STRIP_STYLE}>
        {ordered.map((file) => (
          <Chip
            key={file.id}
            label={file.name}
            selected={file.id === selected.id}
            onClick={() => setSelectedId(file.id)}
            onClose={
              canEdit && !contract.has(file.id)
                ? () => setPendingDelete(file)
                : undefined
            }
          />
        ))}
        {canEdit ? (
          <Chip
            leading={<AddIcon />}
            label={t("newFile", "New file")}
            onClick={() => setAddOpen(true)}
          />
        ) : null}
      </div>
      <div style={EDITOR_WRAP_STYLE}>
        <MonacoEditor
          key={selected.id}
          language="javascript"
          height="100%"
          value={selected.content || ""}
          readOnly={!canEdit}
          options={EDITOR_OPTIONS}
          onChange={(next) => canEdit && updateFile(selected.id, next ?? "")}
        />
      </div>

      <Popover
        open={consoleOpen}
        anchorRef={consoleAnchor}
        onClose={closeConsole}
        ariaLabel={consoleLabel}
      >
        <PanelHeader
          title={consoleLabel}
          onClose={closeConsole}
          closeLabel={t("closeConsole", "Close console")}
          actions={
            logs.length ? (
              <Button variant="subtle" onClick={clearLogs}>
                {t("clear", "Clear")}
              </Button>
            ) : null
          }
        />
        <div style={CONSOLE_BODY_STYLE} role="log">
          {logs.length === 0 ? (
            <p style={{ color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)" }}>
              {t("noLogs", "Nothing logged on this run.")}
            </p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  ...LOG_STYLE,
                  color:
                    log.kind === "error"
                      ? "var(--MH-Theme-Warning-Base, #b9261a)"
                      : "var(--MH-Theme-Neutrals-Black, #171717)",
                }}
              >
                {log.line ? `Line ${log.line}: ` : ""}
                {log.message}
              </div>
            ))
          )}
        </div>
      </Popover>

      <AddFileModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={create}
      />
      <DeleteFileModal
        file={pendingDelete}
        onKeep={() => setPendingDelete(null)}
        onDelete={confirmDelete}
      />
    </Panel>
  );
}

/**
 * Names a new module and explains what one is for. The description is the
 * reason this is a modal rather than an inline field in the strip: nothing else
 * in the builder says that a module runs *alongside* the sketch, so an author
 * would otherwise reach for an import that this runtime doesn't have.
 */
function AddFileModal({ open, onClose, onCreate }) {
  const { t } = useTranslation("visuals");
  const [name, setName] = useState("");

  // Every opening starts from an empty field.
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const typed = name.trim();

  const submit = () => {
    if (!typed) return;
    // A bare name is a JavaScript module; that is what almost every added file
    // is, and typing the extension for it is friction.
    onCreate(typed.includes(".") ? typed : `${typed}.js`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={420}
      title={
        <>
          <span style={{ flex: "1 1 0%" }}>
            {t("addModuleTitle", "Add a code module")}
          </span>
          <IconButton
            variant="subtle"
            icon={<CloseIcon />}
            ariaLabel={t("close", "Close")}
            onClick={onClose}
          />
        </>
      }
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {t("cancel", "Cancel")}
          </Button>
          <Button variant="filled" disabled={!typed} onClick={submit}>
            {t("create", "Create")}
          </Button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px" }}>
        {t(
          "addModuleDescription",
          "Creating a new file lets you declare classes or functions outside the main code in sketch.js. It runs alongside your sketch, so you can reference it anywhere.",
        )}
      </p>
      <Input
        value={name}
        onChange={setName}
        label={t("fileName", "File name")}
        placeholder={t("fileNamePlaceholder", "helpers.js")}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
        }}
      />
    </Modal>
  );
}

/** Keeping the file is the primary action; deleting it is the quiet one. */
function DeleteFileModal({ file, onKeep, onDelete }) {
  const { t } = useTranslation("visuals");

  return (
    <Modal
      open={!!file}
      onClose={onKeep}
      maxWidth={400}
      title={t("deleteFileTitle", "Are you sure you want to delete it?")}
      actions={
        <>
          <Button
            variant="text"
            style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
            onClick={onDelete}
          >
            {t("delete", "Delete")}
          </Button>
          <Button variant="filled" onClick={onKeep}>
            {t("keepFile", "Keep File")}
          </Button>
        </>
      }
    >
      {/* The name stands on its own line rather than inside the sentence: this
          folder's `t()` calls can't interpolate, and a filename spliced into a
          translated string is where word order breaks anyway. */}
      <p style={FILENAME_STYLE}>{file?.name}</p>
      <p style={{ margin: "8px 0 0" }}>
        {t(
          "deleteFileBody",
          "This file will be removed from the visual. This cannot be undone.",
        )}
      </p>
    </Modal>
  );
}
