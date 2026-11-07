"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import IconButton from "../../DesignSystem/IconButton";
import SplitPane from "../../DesignSystem/SplitPane";
import {
  DescriptionIcon,
  EditIcon,
  ExpandCircleUpIcon,
  FileCopyIcon,
  TuneIcon,
  WaveformIcon,
} from "../../DesignSystem/Icons";

import { useUser } from "../../Utils/Access/User";
import { VISUAL } from "../../Queries/YQVisual";
import { COPY_VISUAL } from "../../Mutations/YQVisual";
import { VisualBuilderContext } from "../Context/VisualBuilderContext";
import {
  normalizeDeclarations,
  readBindings,
  resolveValues,
} from "../Helpers/bindings";
import P5Frame from "../Runtime/P5Frame";
import ParameterBus from "../Runtime/parameterBus";
import useVisualDataSources from "../Runtime/useVisualDataSources";
import TopBar from "../Builder/TopBar";
import NavMenu from "../Builder/NavMenu";
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

// What is left under the top bar once it has taken its height.
const FULLSCREEN_STYLE = {
  position: "relative",
  flex: "1 1 0%",
  minHeight: 0,
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
};

// With the bar hidden the sketch takes the whole window, so the way back sits
// on top of it, where the bar's own button was.
const SHOW_BAR_STYLE = {
  position: "fixed",
  top: 8,
  right: 8,
  zIndex: 40,
};

// The builder's vertical-nav body: 8px under the top bar's own 8 to match the
// 16px sides, menu and split side by side.
const BODY_STYLE = {
  display: "flex",
  flex: "1 1 0%",
  minWidth: 0,
  minHeight: 0,
  padding: "8px 16px 16px",
  boxSizing: "border-box",
};

// SplitPane's gutter, as in the builder.
const NAV_MENU_GAP = 12;

/**
 * The builder's top bar, as seen from outside the builder: which visual this is,
 * how it is being viewed, and the way into the builder — Edit for someone who
 * can already change it, Copy & Edit for everyone else signed in.
 */
function ViewerTopBar({ visual, user, mode, onHide }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const [copyVisual, { loading: copying }] = useMutation(COPY_VISUAL);

  const canEdit =
    !!user &&
    (visual.author?.id === user.id ||
      !!visual.collaborators?.some((c) => c.id === user.id));

  async function onCopy() {
    const result = await copyVisual({ variables: { id: visual.id } });
    const id = result.data?.copyVisual?.id;
    if (id) router.push(`/builder/visuals/${id}`);
  }

  // The chip is what tells this apart from the builder at a glance: same bar,
  // but nothing here is saved.
  return (
    <TopBar title={visual.title}>
      <Chip
        variant="static"
        tone="neutral"
        label={
          mode === "authored"
            ? t("viewingAuthored", "Viewing in Authored Mode")
            : t("viewingSandbox", "Viewing in Sandbox Mode")
        }
        title={
          mode === "authored"
            ? t(
                "viewingAuthoredHelp",
                "This is how participants see it: full screen, once their data sources are connected."
              )
            : t(
                "viewingSandboxHelp",
                "Explore freely — nothing you change here is saved to the visual."
              )
        }
      />
      {onHide ? (
        <Button
          variant="subtle"
          leadingIcon={<ExpandCircleUpIcon />}
          onClick={onHide}
        >
          {t("hideMenuBar", "Hide Menu Bar")}
        </Button>
      ) : null}
      {canEdit ? (
        <Button
          variant="filled"
          leadingIcon={<EditIcon />}
          onClick={() => router.push(`/builder/visuals/${visual.id}`)}
        >
          {t("edit", "Edit")}
        </Button>
      ) : user ? (
        <Button
          variant="filled"
          leadingIcon={<FileCopyIcon />}
          disabled={copying}
          onClick={onCopy}
        >
          {t("copyAndEdit", "Copy & Edit")}
        </Button>
      ) : null}
    </TopBar>
  );
}

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
  user: userProp = null,
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
  // Standalone participation is handed only `id`; a study step is handed the
  // participant. Either way, whoever is signed in is who Edit and Copy act for.
  const { user: signedIn } = useUser();
  const user = userProp ?? signedIn;

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
  // Starts as the icon rail: a viewer is here for the visual, and the full menu
  // takes 360px from it.
  const [menuOpen, setMenuOpen] = useState(false);
  const [bus] = useState(() => new ParameterBus());
  const [gatePassed, setGatePassed] = useState(false);
  const [barHidden, setBarHidden] = useState(false);

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
      <div style={SHELL_STYLE}>
        {sourceRuntimes}
        {barHidden ? (
          <IconButton
            variant="subtle"
            icon={<ExpandCircleUpIcon style={{ transform: "rotate(180deg)" }} />}
            ariaLabel={t("showMenuBar", "Show Menu Bar")}
            title={t("showMenuBar", "Show Menu Bar")}
            style={SHOW_BAR_STYLE}
            onClick={() => setBarHidden(false)}
          />
        ) : (
          <ViewerTopBar
            visual={visual}
            user={user}
            mode="authored"
            onHide={() => setBarHidden(true)}
          />
        )}
        {dataSources.length && !gatePassed ? (
          <ConnectScreen
            embedded
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
      </div>
    );
  }

  // The builder's menu, cut down to what a viewer can open. Documentation gets
  // its own line: the builder's invites the author to write guides.
  const navGroups = [
    {
      id: "visualSettings",
      label: "Visual Settings",
      items: [
        {
          id: "parameters",
          label: "Parameters",
          description: "Control the visual with your data and explore other inputs.",
          icon: <TuneIcon />,
        },
        ...(visual.docsVisible
          ? [
              {
                id: "documentation",
                label: "Documentation",
                descriptionKey: "documentationViewerDescription",
                description: "Read the guide that comes with this visual.",
                icon: <DescriptionIcon />,
              },
            ]
          : []),
      ],
    },
    ...(dataSources.length
      ? [
          {
            id: "inputs",
            label: "Inputs",
            items: [
              {
                id: "dataSource",
                labelKey: "dataSources",
                label: "Data Sources",
                description:
                  "Connect to various devices and map your parameters to realtime data.",
                icon: <WaveformIcon />,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <VisualBuilderContext.Provider value={contextValue}>
      {sourceRuntimes}
      <div style={SHELL_STYLE}>
        <ViewerTopBar visual={visual} user={user} mode="sandbox" />
        <div style={BODY_STYLE}>
          <NavMenu
            groups={navGroups}
            selected={tab}
            collapsed={!menuOpen}
            onSelect={setTab}
            onToggle={() => setMenuOpen((open) => !open)}
            style={{ marginRight: NAV_MENU_GAP }}
          />
          <SplitPane
            style={{ flex: "1 1 0%", minWidth: 0 }}
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
