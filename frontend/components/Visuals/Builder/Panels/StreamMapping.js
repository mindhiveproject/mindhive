"use client";

import { useEffect, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import IconButton from "../../../DesignSystem/IconButton";
import MessageCard from "../../../DesignSystem/MessageCard";
import { CloseIcon } from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import {
  bindingFor,
  isStreamMappable,
  labelFor,
  typeLabel,
} from "../../Helpers/bindings";
import {
  CARD_ACTIVE_STYLE,
  CARD_STYLE,
  MapChip,
  NAME_BLOCK_STYLE,
  NAME_STYLE,
  ROW_STYLE,
  TYPE_STYLE,
} from "./Parameters";
import { outputKey } from "../../../../lib/yqOutputs";

const SECTION_TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The whole row toggles, not just the box, so the row is the click target.
const CLICKABLE_ROW_STYLE = { cursor: "pointer" };

// A row on another stream: its name goes quiet along with the checkbox.
const LOCKED_NAME_STYLE = {
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// A row and the message attached under it, close enough to read as one item.
const GROUP_STYLE = { display: "flex", flexDirection: "column", gap: 4 };

const ROW_ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

/**
 * The other half of a parameter's Mapping tab: one output of a linked source,
 * and the parameters that read it.
 *
 * A parameter takes one stream but a stream can feed many parameters, so where
 * the parameter's panel is a choice of one, this is a checklist. Both write the
 * same `mapping` on the parameter's binding. A parameter that already follows
 * a different stream is locked: its row carries that stream's chip, and a
 * message attached under it unmaps the parameter in place, after which it can
 * be ticked here. Rows are listed mapped here, then free, then locked, ranked
 * when the panel opens and held there while it stays open.
 */
export default function StreamMappingPanel({ stream }) {
  const { t } = useTranslation("visuals");
  const {
    canEdit,
    dataSources,
    sourceApis,
    declared,
    bindings,
    updateBinding,
    closePanel,
  } = useVisualBuilder();

  const source = dataSources.find((row) => row.id === stream.sourceId);
  const output = source?.block?.outputs?.find(
    (entry) => outputKey(entry) === stream.output
  );
  const channel = output?.channels?.find((entry) => entry.index === stream.channel);

  const isThis = (mapping) =>
    mapping?.kind === "stream" &&
    mapping.sourceId === stream.sourceId &&
    mapping.output === stream.output &&
    mapping.channel === stream.channel;

  // Mapped here first, then the free ones, then those held by another stream:
  // what can be ticked stays above what has to be unmapped first. Ranked only
  // when the stream or the declared keys change, not on every toggle — a row
  // that jumped on tick or Unmap would slide another under the cursor, and
  // the next click would land on that one instead.
  const declaredKeys = Object.keys(declared || {}).join("\n");
  const order = useMemo(() => {
    const rank = (key) => {
      const mapping = bindingFor(bindings, key).mapping;
      return isThis(mapping) ? 0 : mapping?.kind === "stream" ? 2 : 1;
    };
    return Object.keys(declared || {}).sort((a, b) => rank(a) - rank(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.sourceId, stream.output, stream.channel, declaredKeys]);

  // Unlinked, or filtered out in the source's settings, while this was open.
  useEffect(() => {
    if (!channel) closePanel();
  }, [channel, closePanel]);

  if (!source || !channel) return null;

  // A single channel is one number; a vector reads a whole group, which is
  // picked from the parameter's own panel.
  const keys = order.filter(
    (key) =>
      declared[key].type === "number" &&
      isStreamMappable(declared[key], bindingFor(bindings, key))
  );

  function toggle(key, mapped) {
    updateBinding(key, {
      mapping: mapped
        ? null
        : {
            kind: "stream",
            sourceId: stream.sourceId,
            output: stream.output,
            channel: stream.channel,
          },
    });
  }

  return (
    <Panel
      title={t("mapToParameter", "Map to parameter")}
      actions={
        <IconButton
          variant="text"
          elevated={false}
          icon={<CloseIcon />}
          ariaLabel={t("close", "Close")}
          onClick={closePanel}
        />
      }
    >
      <p style={HELP_STYLE}>
        {channel.label} ·{" "}
        {t("fromSource", "From {{source}}").replace(
          "{{source}}",
          source.label || source.block?.title
        )}
      </p>

      <h3 style={SECTION_TITLE_STYLE}>
        {t("availableParameters", "Available Parameters")}
      </h3>

      {keys.length === 0 ? (
        <p style={HELP_STYLE}>
          {t(
            "noMappableParameters",
            "No parameters can receive this output yet. Only number parameters with Allow Mapping on can be mapped to a device — add one from the Parameters tab."
          )}
        </p>
      ) : (
        keys.map((key) => {
          const declaration = declared[key];
          const mapping = bindingFor(bindings, key).mapping;
          const mapped = isThis(mapping);
          const elsewhere = mapping?.kind === "stream" && !mapped;
          const clickable = canEdit && !elsewhere;

          return (
            <div key={key} style={GROUP_STYLE}>
            <div
              className="Visuals-StreamMappingRow"
              style={{
                ...CARD_STYLE,
                ...(mapped ? CARD_ACTIVE_STYLE : null),
                ...(clickable ? CLICKABLE_ROW_STYLE : null),
              }}
              onClick={clickable ? () => toggle(key, mapped) : undefined}
            >
              <div style={ROW_STYLE}>
                <div style={NAME_BLOCK_STYLE}>
                  <p style={{ ...NAME_STYLE, ...(elsewhere ? LOCKED_NAME_STYLE : null) }}>
                    {labelFor(key, declaration)}
                  </p>
                  <p style={TYPE_STYLE}>{typeLabel(declaration)}</p>
                </div>
                <div style={ROW_ACTIONS_STYLE}>
                  {elsewhere ? (
                    <MapChip
                      binding={bindingFor(bindings, key)}
                      dataSources={dataSources}
                      sourceApis={sourceApis || {}}
                    />
                  ) : null}
                  <Checkbox
                    tone="accent"
                    checked={mapped}
                    disabled={!clickable}
                    ariaLabel={labelFor(key, declaration)}
                  />
                </div>
              </div>
            </div>
            {elsewhere ? (
              <MessageCard
                variant="information"
                style={{ borderRadius: 12 }}
                message={t(
                  "alreadyMapped",
                  "This parameter is already mapped to an output."
                )}
                action={
                  canEdit ? (
                    <Button
                      variant="text"
                      tone="accent"
                      onClick={() => toggle(key, true)}
                    >
                      {t("unmap", "Unmap")}
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
            </div>
          );
        })
      )}
    </Panel>
  );
}
