"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";
import Navbar, { NavbarItem } from "../../DesignSystem/Navbar";
import SplitPane, { COLLAPSE_TRANSITION } from "../../DesignSystem/SplitPane";
import {
  ChevronLeftIcon,
  CodeIcon,
  DescriptionIcon,
  SettingsIcon,
  TuneIcon,
  WaveformIcon,
} from "../../DesignSystem/Icons";

import { VISUAL } from "../../Queries/YQVisual";
import {
  CREATE_VISUAL_CODE_FILE,
  DELETE_VISUAL_CODE_FILE,
  UPDATE_VISUAL,
  UPDATE_VISUAL_CODE_FILE,
} from "../../Mutations/YQVisual";
import {
  CREATE_VISUAL_DATA_SOURCE,
  DELETE_VISUAL_DATA_SOURCE,
} from "../../Mutations/DataSourceBlock";

import { VisualBuilderContext } from "../Context/VisualBuilderContext";
import {
  normalizeDeclarations,
  readBindings,
  resolveValues,
  writeBindings,
} from "../Helpers/bindings";
import {
  ENTRY_TEMPLATE,
  PARAMETERS_TEMPLATE,
} from "../Runtime/buildSketchDocument";
import ParameterBus from "../Runtime/parameterBus";
import useVisualDataSources from "../Runtime/useVisualDataSources";

import TopBar from "./TopBar";
import Preview from "./Preview";
import ShareModal from "./ShareModal";
import DocumentationPanel from "./Panels/Documentation";
import DataSourcesPanel from "./Panels/DataSources";
import ParametersPanel from "./Panels/Parameters";
import ParameterDetailPanel from "./Panels/ParameterDetail";
import DataSourceSettingsPanel from "./Panels/DataSourceSettings";
import CodePanel from "./Panels/Code";
import SettingsPanel from "./Panels/Settings";

const TABS = [
  { id: "documentation", label: "Documentation", icon: <DescriptionIcon /> },
  { id: "dataSource", label: "Data Source", icon: <WaveformIcon /> },
  { id: "parameters", label: "Parameters", icon: <TuneIcon /> },
  { id: "code", label: "Code", icon: <CodeIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

// Viewport units rather than 100%: nothing between here and <body> carries a
// height, so a percentage would collapse onto the content. The rest of the
// builder areas size themselves the same way.
//
// `minWidth: 0` because the shell is a grid item in StyledBuilder: without it
// the column grows to the shell's content, and Monaco lays itself out in pixels
// to whatever it is given — so collapsing the preview widens the editor, which
// widens the column, which widens the editor, until it runs off the page.
const SHELL_STYLE = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  minWidth: 0,
  minHeight: 0,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const NAVBAR_STYLE = { flexShrink: 0, padding: 8 };

// No padding above: the navbar already opens the channel between itself and the
// panels, and adding one here would double it. A row, because the rail the
// preview collapses into sits beside the split rather than over it.
const BODY_STYLE = {
  display: "flex",
  flex: "1 1 0%",
  minWidth: 0,
  minHeight: 0,
  padding: "0 16px 16px",
  boxSizing: "border-box",
};

// Wide enough for the 24px chevron with the panel's own 12px of breathing room
// either side. No gap of its own: the split's divider stays where it was when
// the preview shut, and that gutter is the separation.
const RAIL_WIDTH = 48;

// What the preview leaves behind when it is shut: a strip of the same panel
// surface, still at the edge the preview will come back from. A floating button
// somewhere else on screen says a control appeared; this says the panel is
// still there, pushed aside.
const RAIL_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
  padding: 0,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

// Fixed width, so the contents hold their shape while the rail itself is the
// thing whose width is animating.
const RAIL_CONTENT_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  width: RAIL_WIDTH,
};

// MH-Theme/label/base, turned on its side.
const RAIL_LABEL_STYLE = {
  writingMode: "vertical-rl",
  font: "var(--MH-Type-Label-Base)",
  whiteSpace: "nowrap",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The rail carries a border, so its hover is a fill rather than a second edge.
const RAIL_HOVER_STYLE =
  ".Visuals-Builder-PreviewRail:hover {" +
  "background: var(--MH-Theme-Primary-Lighter, #F4F8F7);" +
  "}" +
  ".Visuals-Builder-PreviewRail:focus-visible {" +
  "outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);" +
  "outline-offset: 2px;" +
  "}";

// The work panel and the parameter detail beside it are one object split in
// two, so they sit closer together than either does to the preview. The 4px
// rides on the detail itself, so it opens along with it.
const WORK_AREA_STYLE = {
  display: "flex",
  minWidth: 0,
  minHeight: 0,
  height: "100%",
};

// The detail opens by growing its *share* of the row rather than by taking a
// width. Both are animating at once — the row is widening as the preview shuts
// beside it — and a share stays honest against a moving container, where a
// width measured when the row was half as wide would not.
const DETAIL_STYLE = {
  flexBasis: 0,
  minWidth: 0,
  overflow: "hidden",
};

// How long typing has to settle before the sketch is rebuilt. Rebuilding per
// keystroke would restart the sketch mid-word; waiting much longer than this
// stops feeling like a live preview.
const RUN_DEBOUNCE_MS = 700;
const SAVE_DEBOUNCE_MS = 1200;

// The languages VisualCodeFile accepts, by file extension. Anything else is
// treated as JavaScript, which is what an author adding a file almost always
// means; the runtime exposes the rest as strings the sketch can read by name.
const LANGUAGES = {
  js: "javascript",
  frag: "glsl",
  vert: "glsl",
  glsl: "glsl",
  css: "css",
  html: "html",
};

export default function VisualBuilder({ query, user }) {
  const { t } = useTranslation("visuals");
  const visualId = query?.selector;

  const { data, loading, error, refetch } = useQuery(VISUAL, {
    variables: { id: visualId },
    skip: !visualId,
    fetchPolicy: "cache-and-network",
  });

  const [updateVisual] = useMutation(UPDATE_VISUAL);
  const [createCodeFile] = useMutation(CREATE_VISUAL_CODE_FILE);
  const [updateCodeFile] = useMutation(UPDATE_VISUAL_CODE_FILE);
  const [deleteCodeFile] = useMutation(DELETE_VISUAL_CODE_FILE);
  const [createDataSource] = useMutation(CREATE_VISUAL_DATA_SOURCE);
  const [deleteDataSource] = useMutation(DELETE_VISUAL_DATA_SOURCE);

  const visual = data?.visual;
  const canEdit =
    !!user?.id &&
    (visual?.author?.id === user.id ||
      !!visual?.collaborators?.some((c) => c.id === user.id));

  const [tab, setTab] = useState("parameters");
  const [detailPanel, setDetailPanel] = useState(null);
  const [focusFileId, setFocusFileId] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  // Settings are saved by an explicit Save, unlike the code, so they are the one
  // thing leaving the builder (or the tab) can lose. The panel reports its
  // draft; `pendingLeave` holds where the author was headed while they decide.
  const router = useRouter();
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState(null);

  function leaveUnlessDirty(go) {
    if (settingsDirty) setPendingLeave(() => go);
    else go();
  }

  useEffect(() => {
    if (!settingsDirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [settingsDirty]);

  // Local drafts of the code files. The server copy is the source of truth on
  // load; from then on this is, until the debounced save catches up.
  const [files, setFiles] = useState([]);
  const [runFiles, setRunFiles] = useState([]);
  const [declared, setDeclared] = useState({});
  const [hasDeclaration, setHasDeclaration] = useState(false);
  const [declarationWarnings, setDeclarationWarnings] = useState([]);
  const [bindings, setBindings] = useState({});
  const [bus] = useState(() => new ParameterBus());

  // The linked devices run here, in the shell, so they stay connected while
  // the author moves between tabs.
  const {
    sources: dataSources,
    apis: sourceApis,
    status: sourceStatus,
    runtimes: sourceRuntimes,
    refetch: refetchSources,
  } = useVisualDataSources(visualId, bus, declared, bindings);

  // Console output from the running sketch. It lives here rather than in the
  // Preview because the author reads it while looking at the code, and the
  // Preview can be hidden entirely.
  const [logs, setLogs] = useState([]);

  const seededRef = useRef(false);
  const saveTimers = useRef({});

  // ── Load ───────────────────────────────────────────────────────────────────

  // Seeded once per visual, never re-read from the cache after that. Every save
  // writes `parameters` back into the cached visual, and re-seeding from it
  // would snap a value being dragged back to whatever the last save carried.
  useEffect(() => {
    if (!visual) return;
    setBindings(readBindings(visual.parameters).bindings);
  }, [visual?.id]);

  useEffect(() => {
    if (!visual) return;
    if (visual.codeFiles?.length) {
      const ordered = [...visual.codeFiles].sort((a, b) => a.order - b.order);
      setFiles(ordered);
      setRunFiles(ordered);
      return;
    }
    // Never seed off a cache-only render. Creating a file doesn't write into
    // this query's cached `codeFiles`, so a remount would read the stale empty
    // list and seed a *second* parameters.js and sketch.js. Waiting for the
    // network response is what makes "this visual has no files" trustworthy.
    if (loading || !canEdit || seededRef.current) return;
    seededRef.current = true;
    seedFiles();
  }, [visual?.id, visual?.codeFiles?.length, canEdit, loading]);

  /**
   * A visual with no child files is either brand new or a YQ-era one whose
   * source still lives in the `code` file field. Adopt the legacy blob when
   * there is one so nothing has to be migrated ahead of time, and start from
   * the templates otherwise.
   */
  async function seedFiles() {
    let entryContent = ENTRY_TEMPLATE;
    if (visual.code?.url) {
      try {
        const response = await fetch(visual.code.url);
        if (response.ok) entryContent = await response.text();
      } catch (e) {
        // Unreachable storage shouldn't stop the editor opening.
      }
    }

    const created = await Promise.all([
      createCodeFile({
        variables: {
          data: {
            visual: { connect: { id: visual.id } },
            name: "parameters.js",
            language: "javascript",
            role: "parameters",
            order: 0,
            content: PARAMETERS_TEMPLATE,
          },
        },
      }),
      createCodeFile({
        variables: {
          data: {
            visual: { connect: { id: visual.id } },
            name: "sketch.js",
            language: "javascript",
            role: "entry",
            order: 1,
            content: entryContent,
          },
        },
      }),
    ]);

    const seeded = created
      .map((result) => result.data?.createVisualCodeFile)
      .filter(Boolean);
    setFiles(seeded);
    setRunFiles(seeded);
    // Leave the cache holding the files that now exist, so nothing downstream
    // reads this visual as empty again.
    refetch().catch(() => {});
  }

  // ── Editing ────────────────────────────────────────────────────────────────

  const updateFile = useCallback(
    (fileId, content) => {
      setFiles((current) =>
        current.map((file) =>
          file.id === fileId ? { ...file, content } : file
        )
      );

      clearTimeout(saveTimers.current[fileId]);
      saveTimers.current[fileId] = setTimeout(() => {
        updateCodeFile({
          variables: {
            data: { content, lastTimeEdited: new Date().toISOString() },
            id: fileId,
          },
        }).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    },
    [updateCodeFile]
  );

  /**
   * Adds a file to the sketch. Everything an author adds is a `module`: the
   * entry and the declaration are roles the runtime and the Parameters tab go
   * looking for, and there is exactly one of each.
   *
   * Resolves with the created file so the caller can select it.
   */
  const addFile = useCallback(
    async (name) => {
      const extension = name.split(".").pop()?.toLowerCase();
      const order =
        files.reduce((last, file) => Math.max(last, file.order ?? 0), 0) + 1;

      const { data: created } = await createCodeFile({
        variables: {
          data: {
            visual: { connect: { id: visualId } },
            name,
            language: LANGUAGES[extension] || "javascript",
            role: "module",
            order,
            content: "",
          },
        },
      });

      const file = created?.createVisualCodeFile;
      if (file) setFiles((current) => [...current, file]);
      return file;
    },
    [createCodeFile, files, visualId]
  );

  const removeFile = useCallback(
    (fileId) => {
      clearTimeout(saveTimers.current[fileId]);
      setFiles((current) => current.filter((file) => file.id !== fileId));
      deleteCodeFile({ variables: { id: fileId } }).catch(() => {});
    },
    [deleteCodeFile]
  );

  // Hand the settled files to the frame, separately from the ones being typed
  // into, so the editor stays responsive while the sketch restarts on a delay.
  useEffect(() => {
    const timer = setTimeout(() => setRunFiles(files), RUN_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(
    () => () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
      // A value set just before leaving would otherwise never be saved.
      saveBindingsRef.current();
    },
    []
  );

  // The save reads the latest bindings when it fires, not the ones it was
  // scheduled with — a drag schedules it dozens of times.
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const bindingsDirty = useRef(false);
  const saveBindingsRef = useRef(null);
  saveBindingsRef.current = () => {
    if (!bindingsDirty.current) return;
    bindingsDirty.current = false;
    updateVisual({
      variables: {
        id: visualId,
        data: {
          parameters: writeBindings(
            bindingsRef.current,
            hasDeclaration ? declared : null
          ),
        },
      },
    }).catch(() => {});
  };

  // YQ lists a visual's parameters from this column, so a key declared in code
  // has to reach it even if its binding is never touched. The update's response
  // refreshes the cached `parameters`, which is what stops this repeating.
  useEffect(() => {
    if (!canEdit || !hasDeclaration) return;
    const stored = readBindings(visual?.parameters).bindings;
    if (
      Array.isArray(visual?.parameters) &&
      Object.keys(declared).every((key) => key in stored)
    ) {
      return;
    }
    bindingsDirty.current = true;
    saveBindingsRef.current();
  }, [declared]);

  // Local state moves on every call so the sketch follows the control; the
  // write to the database waits until the control has been let go of.
  const updateBinding = useCallback((key, patch) => {
    setBindings((current) => ({
      ...current,
      [key]: { ...(current[key] || {}), ...patch },
    }));
    bindingsDirty.current = true;
    clearTimeout(saveTimers.current.bindings);
    saveTimers.current.bindings = setTimeout(
      () => saveBindingsRef.current(),
      SAVE_DEBOUNCE_MS
    );
  }, []);

  // Whether the people a visual is shared with see its documentation at all.
  // Lives on the visual rather than in the Yjs room: it is a sharing decision,
  // not part of the text, and the Settings tab writes the same field.
  const setDocsVisible = useCallback(
    (next) => {
      updateVisual({
        variables: { id: visualId, data: { docsVisible: next } },
      }).catch(() => {});
    },
    [updateVisual, visualId]
  );

  const pushLog = useCallback((entry) => {
    setLogs((current) => [...current.slice(-49), entry]);
  }, []);

  const onDeclare = useCallback(
    (raw) => {
      const { parameters, warnings } = normalizeDeclarations(raw);
      setDeclared(parameters);
      setHasDeclaration(true);
      setDeclarationWarnings(warnings);
      warnings.forEach((message) => pushLog({ kind: "warn", message }));
    },
    [pushLog]
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  // A rebuild is a fresh run — carrying the previous run's errors over would
  // leave a fixed mistake on screen.
  useEffect(() => setLogs([]), [runFiles]);

  useEffect(() => {
    bus.replace(resolveValues(declared, bindings, bus.values));
  }, [bus, declared, bindings]);

  const openPanel = useCallback((panel) => setDetailPanel(panel), []);
  const closePanel = useCallback(() => setDetailPanel(null), []);

  // ── Data sources ───────────────────────────────────────────────────────────

  const linkSource = useCallback(
    async (blockId) => {
      if (!blockId) return;
      await createDataSource({
        variables: {
          data: {
            visual: { connect: { id: visualId } },
            block: { connect: { id: blockId } },
            order: dataSources.length,
          },
        },
      }).catch(() => {});
      refetchSources();
    },
    [createDataSource, visualId, dataSources.length, refetchSources]
  );

  // Parameters mapped onto the source go back to their defaults with it,
  // rather than keeping a mapping that points at nothing.
  const unlinkSource = useCallback(
    async (source) => {
      for (const [key, binding] of Object.entries(bindingsRef.current)) {
        if (binding?.mapping?.sourceId === source.id) {
          updateBinding(key, { mapping: null });
        }
      }
      await deleteDataSource({ variables: { id: source.id } }).catch(() => {});
      refetchSources();
    },
    [deleteDataSource, updateBinding, refetchSources]
  );

  const openSourceSettings = useCallback(
    (sourceId) => setDetailPanel({ sourceId }),
    []
  );

  // From a parameter's empty mapping list to where sources are linked.
  const showDataSources = useCallback(() => {
    setDetailPanel(null);
    setTab("dataSource");
  }, []);

  // ── Preview drawer ─────────────────────────────────────────────────────────

  // Whether it was this component that shut the preview, and so whether it has
  // any business reopening it later.
  const autoShutRef = useRef(false);
  const detailOpen = !!detailPanel;

  /**
   * Show or hide the preview *because the author said so* — the rail, the Hide
   * button, a drag past the minimum. Distinct from the automatic open and close
   * below, which must never overwrite a choice the author has made.
   */
  const showPreview = useCallback((next) => {
    autoShutRef.current = false;
    setPreviewVisible(next);
  }, []);

  // Three panels across leaves none of them a workable width, so opening the
  // parameter detail shuts the preview and closing it brings the preview back.
  // The author can still pull the preview out over all three; doing so goes
  // through `showPreview`, which is what stops the close undoing it.
  useEffect(() => {
    if (detailOpen) {
      autoShutRef.current = previewVisible;
      setPreviewVisible(false);
    } else if (autoShutRef.current) {
      autoShutRef.current = false;
      setPreviewVisible(true);
    }
    // Deliberately only on the open/close edge: `previewVisible` is read for
    // what it was at that moment, not subscribed to.
  }, [detailOpen]);

  // The sketch stops drawing once the pane is shut rather than the moment it
  // starts closing — a canvas that has stopped repainting while it is still
  // being squeezed shows the stage black behind it.
  const [previewPaused, setPreviewPaused] = useState(false);

  useEffect(() => {
    if (previewVisible) {
      setPreviewPaused(false);
      return;
    }
    const timer = setTimeout(
      () => setPreviewPaused(true),
      COLLAPSE_TRANSITION.duration * 1000
    );
    return () => clearTimeout(timer);
  }, [previewVisible]);

  // Adding or deleting a parameter is a text edit on a file, so the panels that
  // do it need a way to show the author where the edit landed.
  const revealFile = useCallback((fileId) => {
    setTab("code");
    setFocusFileId(fileId);
  }, []);

  const contextValue = useMemo(
    () => ({
      visual,
      canEdit,
      user,
      files,
      updateFile,
      addFile,
      removeFile,
      declared,
      hasDeclaration,
      declarationWarnings,
      bindings,
      updateBinding,
      setDocsVisible,
      bus,
      dataSources,
      sourceApis,
      linkSource,
      unlinkSource,
      openSourceSettings,
      showDataSources,
      openPanel,
      closePanel,
      // Which parameter the detail panel is pointed at, so the row it came from
      // can show itself as the selected one.
      detailKey: detailPanel?.paramKey ?? null,
      detailSourceId: detailPanel?.sourceId ?? null,
      revealFile,
      focusFileId,
      logs,
      clearLogs,
    }),
    [
      visual,
      canEdit,
      user,
      files,
      updateFile,
      addFile,
      removeFile,
      declared,
      hasDeclaration,
      declarationWarnings,
      bindings,
      updateBinding,
      setDocsVisible,
      bus,
      dataSources,
      sourceApis,
      linkSource,
      unlinkSource,
      openSourceSettings,
      showDataSources,
      openPanel,
      closePanel,
      detailPanel,
      revealFile,
      focusFileId,
      logs,
      clearLogs,
    ]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!visualId) return null;
  if (loading && !visual) {
    return <div style={{ padding: 24 }}>{t("loading", "Loading…")}</div>;
  }
  if (error || !visual) {
    return (
      <div style={{ padding: 24 }}>
        {t("notFound", "This visual could not be opened.")}
      </div>
    );
  }

  const workPanel = {
    documentation: <DocumentationPanel />,
    dataSource: <DataSourcesPanel />,
    parameters: <ParametersPanel />,
    code: <CodePanel />,
    settings: <SettingsPanel user={user} onDirtyChange={setSettingsDirty} />,
  }[tab];

  return (
    <VisualBuilderContext.Provider value={contextValue}>
      {sourceRuntimes}
      <div className="Visuals-Builder" style={SHELL_STYLE}>
        <TopBar
          title={visual.title}
          onShare={() => setShareOpen(true)}
          onBack={(event) => {
            // The link navigates on its own when there is nothing to lose.
            if (!settingsDirty) return;
            event.preventDefault();
            leaveUnlessDirty(() => router.push("/dashboard/develop/visuals"));
          }}
        />

        <Navbar style={NAVBAR_STYLE}>
          {TABS.map((entry) => (
            <NavbarItem
              key={entry.id}
              leadingIcon={entry.icon}
              selected={tab === entry.id}
              onClick={() => leaveUnlessDirty(() => setTab(entry.id))}
            >
              {t(entry.id, entry.label)}
            </NavbarItem>
          ))}
        </Navbar>

        <div style={BODY_STYLE}>
          <style dangerouslySetInnerHTML={{ __html: RAIL_HOVER_STYLE }} />
          <SplitPane
            style={{ flex: "1 1 0%", minWidth: 0 }}
            collapsed={!previewVisible}
            onCollapsedChange={(shut) => showPreview(!shut)}
            expandLabel={t("showPreview", "Show Preview")}
            defaultFraction={0.5}
            minStart={360}
            minEnd={320}
            start={
              <div style={WORK_AREA_STYLE}>
                <div style={{ flex: "1 1 0%", minWidth: 0 }}>{workPanel}</div>
                <AnimatePresence initial={false}>
                  {detailPanel ? (
                    <motion.div
                      style={DETAIL_STYLE}
                      initial={{ flexGrow: 0, marginLeft: 0 }}
                      animate={{ flexGrow: 1, marginLeft: 4 }}
                      exit={{ flexGrow: 0, marginLeft: 0 }}
                      transition={COLLAPSE_TRANSITION}
                    >
                      {detailPanel.sourceId ? (
                        <DataSourceSettingsPanel sourceId={detailPanel.sourceId} />
                      ) : (
                        <ParameterDetailPanel
                          paramKey={detailPanel.paramKey}
                          initialTab={detailPanel.initialTab}
                        />
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            }
            end={
              <Preview
                files={runFiles}
                bus={bus}
                sources={sourceStatus}
                logs={logs}
                paused={previewPaused}
                onDeclare={onDeclare}
                onLog={pushLog}
                onHide={() => showPreview(false)}
              />
            }
          />

          {/* The whole strip is the target — at 48px wide, asking the author to
              find a button inside it would be the floating button again. */}
          <AnimatePresence initial={false}>
            {previewVisible ? null : (
              <motion.button
                type="button"
                className="Visuals-Builder-PreviewRail"
                style={RAIL_STYLE}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: RAIL_WIDTH, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={COLLAPSE_TRANSITION}
                onClick={() => showPreview(true)}
                aria-label={t("showPreview", "Show Preview")}
                title={t("showPreview", "Show Preview")}
              >
                <span style={RAIL_CONTENT_STYLE} aria-hidden>
                  <ChevronLeftIcon />
                  <span style={RAIL_LABEL_STYLE}>{t("preview", "Preview")}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
        <DiscardChangesModal
          open={!!pendingLeave}
          onKeep={() => setPendingLeave(null)}
          onDiscard={() => {
            pendingLeave();
            setPendingLeave(null);
          }}
        />
      </div>
    </VisualBuilderContext.Provider>
  );
}

/** Staying is the primary action; leaving without saving is the quiet one. */
function DiscardChangesModal({ open, onKeep, onDiscard }) {
  const { t } = useTranslation("visuals");

  return (
    <Modal
      open={open}
      onClose={onKeep}
      maxWidth={400}
      title={t("discardChangesTitle", "Discard unsaved changes?")}
      actions={
        <>
          <Button
            variant="text"
            style={{ color: "var(--MH-Theme-Warning-Base, #b9261a)" }}
            onClick={onDiscard}
          >
            {t("discard", "Discard")}
          </Button>
          <Button variant="filled" onClick={onKeep}>
            {t("keepEditing", "Keep Editing")}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>
        {t(
          "discardChangesBody",
          "Your changes to the settings haven't been saved. If you leave now, they will be lost."
        )}
      </p>
    </Modal>
  );
}
