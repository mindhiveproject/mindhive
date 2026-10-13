"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import {
  AddIcon,
  ArrowDropDownIcon,
  DeleteIcon,
  SettingsIcon,
  WaveformIcon,
} from "../../../DesignSystem/Icons";

import LinkDataSourceModal from "../../../Builder/Project/Builder/DataSources/LinkModal";
import {
  InputRow,
  StatusIndicator,
} from "../../../Studies/Run/DataSources/ConnectScreen";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import { channelKey } from "../../../../lib/yqOutputs";

const EMPTY_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: 8,
  padding: "32px 24px",
};

const EMPTY_ICON_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "var(--MH-Theme-Primary-Lighter, #F4F8F7)",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
  marginBottom: 8,
};

const EMPTY_TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const EMPTY_BODY_STYLE = {
  margin: 0,
  maxWidth: 380,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// Figma "Data Source Block": a Light-Green card whose input rows sit on the
// grey surface, the inverse of the participant connect screen's white card.
const BLOCK_STYLE = {
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  borderRadius: 12,
  overflow: "hidden",
  paddingBottom: 8,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const BLOCK_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "12px 16px 8px",
};

// Figma draws these Semibold; MH-Type-Title-Base is Medium (500).
const BLOCK_TITLE_STYLE = {
  margin: 0,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BLOCK_DESCRIPTION_STYLE = {
  margin: 0,
  padding: "0 16px 12px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const DIVIDER_STYLE = {
  height: 1,
  margin: "4px 0",
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const SECTION_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "8px 16px 12px",
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const SECTION_TITLE_STYLE = {
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const CHIPS_STYLE = { display: "flex", flexWrap: "wrap", gap: 4 };

// The Remove button's own left padding lines its icon up with the content
// above, so the footer only pads the right.
const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 16px 0 0",
};

// A face landmarker alone emits ~50 blendshapes; past this many the outputs
// stop being a summary and start being a wall.
const OUTPUTS_SHOWN = 20;

/**
 * The Data Source tab: the sources linked into this visual, each one live.
 *
 * The devices themselves run in the builder shell rather than here, so
 * switching tabs never disconnects a headset; this panel only reads their
 * status and drives their connect buttons. Linking goes through the study
 * builder's own catalog modal.
 */
export default function DataSourcesPanel() {
  const { t } = useTranslation("visuals");
  const {
    user,
    canEdit,
    dataSources,
    sourceApis,
    linkSource,
    unlinkSource,
    openSourceSettings,
    detailSourceId,
  } = useVisualBuilder();
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <Panel
      title={t("linkedDataSources", "Linked Data Sources")}
      actions={
        canEdit ? (
          <Button
            variant="filled"
            leadingIcon={<AddIcon />}
            onClick={() => setLinkOpen(true)}
          >
            {t("linkADataSource", "Link a Data Source")}
          </Button>
        ) : null
      }
    >
      {dataSources.length === 0 ? (
        <div style={EMPTY_STYLE}>
          <span style={EMPTY_ICON_STYLE}>
            <WaveformIcon />
          </span>
          <h3 style={EMPTY_TITLE_STYLE}>
            {t("noDataSources", "No data sources linked yet")}
          </h3>
          <p style={EMPTY_BODY_STYLE}>
            {canEdit
              ? t(
                  "noDataSourcesBody",
                  "Link a data source to connect a device, then map its outputs onto this visual's parameters from the Parameters tab."
                )
              : t(
                  "noDataSourcesViewer",
                  "This visual doesn't use any devices. Its parameters are set by hand."
                )}
          </p>
        </div>
      ) : (
        dataSources.map((source) => (
          <DataSourceBlock
            key={source.id}
            source={source}
            api={sourceApis[source.id]}
            canEdit={canEdit}
            onRemove={() => unlinkSource(source)}
            onSettings={() => openSourceSettings(source.id)}
          />
        ))
      )}

      {canEdit ? (
        <LinkDataSourceModal
          open={linkOpen}
          user={user}
          sources={dataSources}
          selectedSourceId={detailSourceId}
          onClose={() => setLinkOpen(false)}
          onAddSource={linkSource}
          onRemoveSource={unlinkSource}
          onOpenSettings={(id) => {
            setLinkOpen(false);
            openSourceSettings(id);
          }}
          description={t(
            "linkDataSourceDescription",
            "Link a data source to drive this visual's parameters from a device."
          )}
          warning={null}
        />
      ) : null}
    </Panel>
  );
}

/** A collapsible Inputs / Outputs group inside a block. */
function BlockSection({ title, actions = null, children }) {
  const { t } = useTranslation("visuals");
  const [open, setOpen] = useState(true);
  return (
    <div style={SECTION_STYLE}>
      <div style={SECTION_HEADER_STYLE}>
        <span className="MH-Type-Title-Base" style={SECTION_TITLE_STYLE}>
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {actions}
          <IconButton
            variant="text"
            elevated={false}
            icon={
              <ArrowDropDownIcon
                style={{ transform: open ? undefined : "rotate(-90deg)" }}
              />
            }
            ariaLabel={
              open ? t("collapse", "Collapse") : t("expand", "Expand")
            }
            aria-expanded={open}
            onClick={() => setOpen((on) => !on)}
          />
        </span>
      </div>
      {open ? children : null}
    </div>
  );
}

/**
 * One linked source (Figma "Data Source Block"): its connect rows, the outputs
 * it streams, and — for an editor — Remove and Settings.
 *
 * Output chips light up in Tertiary while the source is streaming, so an author
 * can see at a glance which channels are there to map.
 */
function DataSourceBlock({ source, api, canEdit, onRemove, onSettings }) {
  const { t } = useTranslation("visuals");
  const [showAll, setShowAll] = useState(false);
  const { block } = source;
  const streaming = !!api?.streaming;

  const excluded = new Set(source.settings?.excludedChannels || []);
  const channels = (block.outputs || []).flatMap((output) =>
    (output.channels || [])
      .map((channel) => ({ key: channelKey(output, channel.index), channel }))
      .filter(({ key }) => !excluded.has(key))
  );
  const shown = showAll ? channels : channels.slice(0, OUTPUTS_SHOWN);

  return (
    <div className="Visuals-DataSourceBlock" style={BLOCK_STYLE}>
      <div style={BLOCK_HEADER_STYLE}>
        <p className="MH-Type-Title-Base" style={BLOCK_TITLE_STYLE}>
          {source.label || block.title}
        </p>
        <StatusIndicator streaming={streaming} />
      </div>
      {block.description ? (
        <p className="MH-Type-Body-Base" style={BLOCK_DESCRIPTION_STYLE}>
          {block.description}
        </p>
      ) : null}

      {(block.inputs || []).length ? (
        <>
          <div style={DIVIDER_STYLE} />
          <BlockSection title={t("inputs", "Inputs")}>
            {block.inputs.map((input) => (
              <InputRow
                key={input.id}
                nested
                input={input}
                status={api?.inputStatus[input.id]}
                onConnect={api?.connect}
                onDisconnect={api?.disconnect}
                videoElement={api?.getVideoElement(input.id)}
              />
            ))}
          </BlockSection>
        </>
      ) : null}

      {channels.length ? (
        <>
          <div style={DIVIDER_STYLE} />
          <BlockSection title={t("outputs", "Outputs")}>
            <div style={CHIPS_STYLE}>
              {shown.map(({ key, channel }) =>
                streaming ? (
                  <Chip key={key} label={channel.label} selected accent="tertiary" />
                ) : (
                  <Chip key={key} label={channel.label} variant="static" tone="neutral" />
                )
              )}
              {channels.length > OUTPUTS_SHOWN ? (
                <Chip
                  label={
                    showAll
                      ? t("showLess", "Show Less")
                      : t("showMore", "Show More")
                  }
                  onClick={() => setShowAll((on) => !on)}
                />
              ) : null}
            </div>
          </BlockSection>
        </>
      ) : null}

      {canEdit ? (
        <>
          <div style={DIVIDER_STYLE} />
          <div style={FOOTER_STYLE}>
            <Button variant="text" leadingIcon={<DeleteIcon />} onClick={onRemove}>
              {t("remove", "Remove")}
            </Button>
            <Button
              variant="tonal"
              tone="tertiary"
              leadingIcon={<SettingsIcon />}
              onClick={onSettings}
            >
              {t("settings", "Settings")}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
