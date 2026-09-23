"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import Modal from "../../../DesignSystem/Modal";
import {
  AddIcon,
  CloseIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from "../../../DesignSystem/Icons";
import { collabWsUrl } from "../../../../config";

import Panel from "../Panel";
import DocsEditor from "../DocsEditor";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";

const STRIP_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  flexShrink: 0,
  padding: "0 16px 12px",
};

const EMPTY_STYLE = {
  flex: "1 1 0%",
  padding: "0 16px 16px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The fragment YQ's own docs editor binds, and the one the viewer shows first.
// It is the page that always exists, so it has no entry in `docPages`.
const MAIN_FIELD = "docs";

/**
 * The Documentation tab.
 *
 * Bound straight to the `visual:<id>` Yjs room — the same room YQ's docs editor
 * uses, so the two frontends stay in sync while both are running, and the collab
 * server persists it exactly as it already does. There is no separate save path
 * here on purpose.
 *
 * A visual's documentation is more than one page: the main page is the overview
 * a participant reads first, and an author can add further pages beside it. Each
 * page is another named fragment of that same room, so they all ride on the one
 * socket this panel opens and are persisted by the same `yjsState` blob. The
 * list of pages is itself a shared array in the room rather than a column on the
 * Visual — it is collaborative content, and keeping it there means adding a page
 * needs no mutation and can't drift from the fragment it points at.
 */
export default function DocumentationPanel() {
  const { t } = useTranslation("visuals");
  const { visual, canEdit, user, setDocsVisible } = useVisualBuilder();

  const [provider, setProvider] = useState(null);
  const [pages, setPages] = useState([]);
  const [field, setField] = useState(MAIN_FIELD);
  const [addOpen, setAddOpen] = useState(false);
  // The page the delete modal is asking about, or null when it is closed.
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (!visual?.id) return undefined;
    const opened = new HocuspocusProvider({
      url: collabWsUrl,
      name: `visual:${visual.id}`,
      // Auth travels with the session cookie on the WS upgrade — no token needed.
      token: "",
    });
    setProvider(opened);
    return () => {
      opened.destroy();
      setProvider(null);
    };
  }, [visual?.id]);

  useEffect(() => {
    if (!provider) return undefined;
    const shared = provider.document.getArray("docPages");
    const read = () => setPages(shared.toArray());
    read();
    shared.observe(read);
    return () => shared.unobserve(read);
  }, [provider]);

  // A page someone else deleted must not leave this client editing a fragment
  // no tab points at any more.
  useEffect(() => {
    if (field === MAIN_FIELD) return;
    if (!pages.some((page) => `docs:${page.id}` === field)) setField(MAIN_FIELD);
  }, [pages, field]);

  const addPage = (title) => {
    setAddOpen(false);
    const page = { id: crypto.randomUUID(), title };
    provider.document.getArray("docPages").push([page]);
    setField(`docs:${page.id}`);
  };

  const confirmDelete = () => {
    const page = pendingDelete;
    setPendingDelete(null);
    const shared = provider.document.getArray("docPages");
    const index = shared.toArray().findIndex((entry) => entry.id === page.id);
    // Only the entry goes: the page's own fragment stays in the room as orphaned
    // text. Nothing reaches it once the tab is gone, and page ids are never
    // reused, so clearing it would only cost another update to sync.
    if (index !== -1) shared.delete(index, 1);
  };

  const docsVisible = !!visual?.docsVisible;

  return (
    <Panel
      flush
      title={t("documentation", "Documentation")}
      actions={
        canEdit && setDocsVisible ? (
          <Button
            variant={docsVisible ? "tonal" : "outline"}
            leadingIcon={docsVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            onClick={() => setDocsVisible(!docsVisible)}
          >
            {docsVisible ? t("visible", "Visible") : t("hidden", "Hidden")}
          </Button>
        ) : null
      }
    >
      <div style={STRIP_STYLE}>
        <Chip
          label={t("overview", "Overview")}
          selected={field === MAIN_FIELD}
          onClick={() => setField(MAIN_FIELD)}
        />
        {pages.map((page) => (
          <Chip
            key={page.id}
            label={page.title}
            selected={field === `docs:${page.id}`}
            onClick={() => setField(`docs:${page.id}`)}
            onClose={canEdit ? () => setPendingDelete(page) : undefined}
          />
        ))}
        {canEdit ? (
          <Chip
            leading={<AddIcon />}
            label={t("newPage", "New page")}
            onClick={() => setAddOpen(true)}
          />
        ) : null}
      </div>

      {provider ? (
        <DocsEditor
          key={field}
          provider={provider}
          field={field}
          editable={canEdit}
          user={user}
          emptyInvite={
            field === MAIN_FIELD
              ? t(
                  "docsInvite",
                  "Explain what this visual shows and what a participant should do.",
                )
              : t("pageInvite", "Write this page.")
          }
        />
      ) : (
        <p style={EMPTY_STYLE}>{t("connecting", "Connecting…")}</p>
      )}

      <AddPageModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={addPage}
      />
      <DeletePageModal
        page={pendingDelete}
        onKeep={() => setPendingDelete(null)}
        onDelete={confirmDelete}
      />
    </Panel>
  );
}

/** Names a new page. The title is what the tab reads, so it is asked for up front. */
function AddPageModal({ open, onClose, onCreate }) {
  const { t } = useTranslation("visuals");
  const [title, setTitle] = useState("");

  // Every opening starts from an empty field.
  useEffect(() => {
    if (open) setTitle("");
  }, [open]);

  const typed = title.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={420}
      title={
        <>
          <span style={{ flex: "1 1 0%" }}>
            {t("addPageTitle", "Add a page")}
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
          <Button
            variant="filled"
            disabled={!typed}
            onClick={() => onCreate(typed)}
          >
            {t("create", "Create")}
          </Button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px" }}>
        {t(
          "addPageDescription",
          "Pages sit beside the overview, for anything that would crowd it — setup steps, what the parameters mean, or how to read what the visual draws.",
        )}
      </p>
      <Input
        value={title}
        onChange={setTitle}
        label={t("pageTitle", "Page title")}
        placeholder={t("pageTitlePlaceholder", "Setting up your headset")}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter" && typed) onCreate(typed);
        }}
      />
    </Modal>
  );
}

/** Keeping the page is the primary action; deleting it is the quiet one. */
function DeletePageModal({ page, onKeep, onDelete }) {
  const { t } = useTranslation("visuals");

  return (
    <Modal
      open={!!page}
      onClose={onKeep}
      maxWidth={400}
      title={t("deletePageTitle", "Are you sure you want to delete it?")}
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
            {t("keepPage", "Keep Page")}
          </Button>
        </>
      }
    >
      {/* The title stands on its own line rather than inside the sentence: this
          folder's `t()` calls can't interpolate, and a name spliced into a
          translated string is where word order breaks anyway. */}
      <p style={{ margin: 0, font: "var(--MH-Type-Title-Base)" }}>{page?.title}</p>
      <p style={{ margin: "8px 0 0" }}>
        {t(
          "deletePageBody",
          "This page and everything written on it will be removed. This cannot be undone.",
        )}
      </p>
    </Modal>
  );
}
