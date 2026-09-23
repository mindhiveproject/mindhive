"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../DesignSystem/Navbar";
import SplitPane from "../../DesignSystem/SplitPane";
import { DescriptionIcon, TuneIcon } from "../../DesignSystem/Icons";

import { VISUAL } from "../../Queries/YQVisual";
import { VisualBuilderContext } from "../Context/VisualBuilderContext";
import { readBindings, resolveValues } from "../Helpers/bindings";
import P5Frame from "../Runtime/P5Frame";
import Preview from "../Builder/Preview";
import DocumentationPanel from "../Builder/Panels/Documentation";
import ParametersPanel from "../Builder/Panels/Parameters";

const SHELL_STYLE = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  minHeight: 0,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const FULLSCREEN_STYLE = {
  position: "fixed",
  inset: 0,
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BODY_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  padding: 16,
  boxSizing: "border-box",
};

/**
 * Participating in a visual, as opposed to authoring it.
 *
 * The prop shape is the one `Tasks/Run/Main.js` calls a study step with, even
 * though standalone participation only ever supplies `id`. Authored mode *is*
 * the study-step renderer — full screen, no panel — so giving it that signature
 * now means the later study integration is wiring rather than a second
 * implementation of the same thing.
 *
 * Nothing a participant changes is written back. That is enforced structurally
 * rather than by rule: the same panels the builder uses are rendered against a
 * context whose `updateBinding` is local state and whose `canEdit` is false, so
 * there is no path from here to a mutation.
 */
export default function VisualViewer({
  id,
  user = null,
  // eslint-disable-next-line no-unused-vars
  study = null,
  // eslint-disable-next-line no-unused-vars
  currentStep = null,
  // eslint-disable-next-line no-unused-vars
  onFinish = null,
  // eslint-disable-next-line no-unused-vars
  isSavingData = false,
}) {
  const { t } = useTranslation("visuals");

  const { data, loading } = useQuery(VISUAL, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });
  const visual = data?.visual;

  const [sessionBindings, setSessionBindings] = useState(null);
  const [declared, setDeclared] = useState({});
  const [hasDeclaration, setHasDeclaration] = useState(false);
  const [tab, setTab] = useState("parameters");

  // Seeded from the author's bindings, then owned entirely by this session.
  // Memoized because `readBindings` builds a fresh object each call, which would
  // otherwise change identity every render and push a new value message into the
  // frame on each one.
  const authoredBindings = useMemo(
    () => readBindings(visual?.parameters).bindings,
    [visual?.parameters]
  );
  const bindings = sessionBindings ?? authoredBindings;

  const files = useMemo(
    () => [...(visual?.codeFiles || [])].sort((a, b) => a.order - b.order),
    [visual?.codeFiles]
  );

  const updateBinding = useCallback((key, patch) => {
    setSessionBindings((current) => ({
      ...(current || {}),
      [key]: { ...((current || {})[key] || {}), ...patch },
    }));
  }, []);

  const onDeclare = useCallback((parameters) => {
    setDeclared(parameters);
    setHasDeclaration(true);
  }, []);

  const values = useMemo(
    () => resolveValues(declared, bindings),
    [declared, bindings]
  );

  const noop = useCallback(() => {}, []);

  const contextValue = useMemo(
    () => ({
      visual,
      canEdit: false,
      user,
      files,
      updateFile: noop,
      declared,
      hasDeclaration,
      bindings,
      updateBinding,
      values,
      openPanel: noop,
      closePanel: noop,
      revealFile: noop,
      focusFileId: null,
    }),
    [
      visual,
      user,
      files,
      noop,
      declared,
      hasDeclaration,
      bindings,
      updateBinding,
      values,
    ]
  );

  if (loading && !visual) {
    return <div style={{ padding: 24 }}>{t("loading", "Loading…")}</div>;
  }
  if (!visual) {
    return (
      <div style={{ padding: 24 }}>
        {t("notShared", "This visual isn't available to you.")}
      </div>
    );
  }

  // Authored mode: connect, then experience. There is nothing to connect *to*
  // until data sources land, so this is the experience half only — the connect
  // checklist is built from the visual's data sources and arrives with them.
  if (visual.participationMode === "authored") {
    return (
      <div style={FULLSCREEN_STYLE}>
        <P5Frame files={files} values={values} onDeclare={onDeclare} />
      </div>
    );
  }

  const tabs = [
    ...(visual.docsVisible
      ? [
          {
            id: "documentation",
            label: t("documentation", "Documentation"),
            icon: <DescriptionIcon />,
          },
        ]
      : []),
    { id: "parameters", label: t("parameters", "Parameters"), icon: <TuneIcon /> },
  ];

  return (
    <VisualBuilderContext.Provider value={contextValue}>
      <div style={SHELL_STYLE}>
        <Navbar style={{ flexShrink: 0, padding: "8px" }}>
          {tabs.map((entry) => (
            <NavbarItem
              key={entry.id}
              leadingIcon={entry.icon}
              selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </NavbarItem>
          ))}
        </Navbar>
        <div style={BODY_STYLE}>
          <SplitPane
            defaultFraction={0.4}
            minStart={320}
            minEnd={320}
            start={
              tab === "documentation" ? (
                <DocumentationPanel />
              ) : (
                <ParametersPanel />
              )
            }
            end={
              <Preview files={files} values={values} onDeclare={onDeclare} />
            }
          />
        </div>
      </div>
    </VisualBuilderContext.Provider>
  );
}
