"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Navbar, { NavbarItem } from "../../DesignSystem/Navbar";
import SplitPane from "../../DesignSystem/SplitPane";
import {
  DescriptionIcon,
  TuneIcon,
  WaveformIcon,
} from "../../DesignSystem/Icons";

import { VISUAL } from "../../Queries/YQVisual";
import { VisualBuilderContext } from "../Context/VisualBuilderContext";
import {
  normalizeDeclarations,
  readBindings,
  resolveValues,
} from "../Helpers/bindings";
import P5Frame from "../Runtime/P5Frame";
import ParameterBus from "../Runtime/parameterBus";
import useVisualDataSources from "../Runtime/useVisualDataSources";
import Preview from "../Builder/Preview";
import DocumentationPanel from "../Builder/Panels/Documentation";
import DataSourcesPanel from "../Builder/Panels/DataSources";
import ParametersPanel from "../Builder/Panels/Parameters";
import ConnectScreen from "../../Studies/Run/DataSources/ConnectScreen";
import DisconnectedToasts from "./DisconnectedToasts";

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
  const [bus] = useState(() => new ParameterBus());
  const [gatePassed, setGatePassed] = useState(false);

  // Seeded from the author's bindings, then owned entirely by this session.
  // Memoized because `readBindings` builds a fresh object each call, which would
  // otherwise change identity every render and re-resolve every value on each
  // one.
  const authoredBindings = useMemo(
    () => readBindings(visual?.parameters).bindings,
    [visual?.parameters]
  );
  const bindings = sessionBindings ?? authoredBindings;

  const {
    sources: dataSources,
    apis: sourceApis,
    status: sourceStatus,
    runtimes: sourceRuntimes,
    loading: sourcesLoading,
  } = useVisualDataSources(id, bus, declared, bindings);

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

  // Declaration warnings are the author's business; a participant has no
  // console to read them in.
  const onDeclare = useCallback((raw) => {
    setDeclared(normalizeDeclarations(raw).parameters);
    setHasDeclaration(true);
  }, []);

  useEffect(() => {
    bus.replace(resolveValues(declared, bindings, bus.values));
  }, [bus, declared, bindings]);

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
      bus,
      dataSources,
      sourceApis,
      detailSourceId: null,
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
      bus,
      dataSources,
      sourceApis,
    ]
  );

  if ((loading && !visual) || sourcesLoading) {
    return <div style={{ padding: 24 }}>{t("loading", "Loading…")}</div>;
  }
  if (!visual) {
    return (
      <div style={{ padding: 24 }}>
        {t("notShared", "This visual isn't available to you.")}
      </div>
    );
  }

  // Authored mode: connect, then experience. The connect half is the study
  // run's own gate, so a visual asks for its devices exactly the way a study
  // does; the sources keep running underneath it once it is passed.
  if (visual.participationMode === "authored") {
    const allRequiredConnected = dataSources.every(
      (source) => sourceApis[source.id]?.requiredConnected
    );
    return (
      <>
        {sourceRuntimes}
        {dataSources.length && !gatePassed ? (
          <ConnectScreen
            study={visual}
            rows={dataSources}
            apis={sourceApis}
            allRequiredConnected={allRequiredConnected}
            onContinue={() => setGatePassed(true)}
            onPreview={noop}
            onLeave={() => window.history.back()}
            heading={t(
              "visualCollectsData",
              "This visual uses data from other devices"
            )}
            leaveLabel={t("leave", "Leave")}
          />
        ) : (
          <div style={FULLSCREEN_STYLE}>
            <P5Frame
              files={files}
              bus={bus}
              sources={sourceStatus}
              onDeclare={onDeclare}
            />
            <DisconnectedToasts rows={dataSources} apis={sourceApis} />
          </div>
        )}
      </>
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
    ...(dataSources.length
      ? [
          {
            id: "dataSource",
            label: t("dataSource", "Data Source"),
            icon: <WaveformIcon />,
          },
        ]
      : []),
    { id: "parameters", label: t("parameters", "Parameters"), icon: <TuneIcon /> },
  ];

  return (
    <VisualBuilderContext.Provider value={contextValue}>
      {sourceRuntimes}
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
              ) : tab === "dataSource" ? (
                <DataSourcesPanel />
              ) : (
                <ParametersPanel />
              )
            }
            end={
              <Preview
                files={files}
                bus={bus}
                sources={sourceStatus}
                onDeclare={onDeclare}
              />
            }
          />
        </div>
      </div>
    </VisualBuilderContext.Provider>
  );
}
