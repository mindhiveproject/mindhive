"use client";

import { useEffect } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import { CheckIcon, CloseIcon, LinkOffIcon } from "../../../DesignSystem/Icons";

import { UPDATE_VISUAL_DATA_SOURCE } from "../../../Mutations/DataSourceBlock";
import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import { channelKey } from "../../../../lib/yqOutputs";

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

const FIELD_STYLE = { display: "flex", flexDirection: "column", gap: 4 };

const CHIPS_STYLE = { display: "flex", flexWrap: "wrap", gap: 4 };

/**
 * Settings for one data source linked into the visual — the right-hand detail
 * slot, where a parameter's settings open too.
 *
 * These are the study builder's per-source settings (DataSources/Settings.js)
 * minus the ones that only mean something inside a study: recording,
 * streaming to the next block and the participant's signal preview. What is
 * left is which outputs this visual uses and the block's advanced options.
 * Excluding an output hides it from the block card and from every parameter's
 * mapping list.
 */
export default function DataSourceSettingsPanel({ sourceId }) {
  const { t } = useTranslation("visuals");
  const { canEdit, dataSources, unlinkSource, closePanel } = useVisualBuilder();
  const source = dataSources.find((row) => row.id === sourceId);

  const [updateSource] = useMutation(UPDATE_VISUAL_DATA_SOURCE);

  // Unlinked from the modal or the card while this was open.
  useEffect(() => {
    if (!source) closePanel();
  }, [source, closePanel]);

  if (!source) return null;

  const settings = source.settings || {};
  const patchSettings = (patch) =>
    updateSource({
      variables: { id: source.id, data: { settings: { ...settings, ...patch } } },
    }).catch(() => {});

  const excluded = new Set(settings.excludedChannels || []);
  const toggleChannel = (key) => {
    const next = new Set(excluded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    patchSettings({ excludedChannels: Array.from(next) });
  };

  const channels = (source.block?.outputs || []).flatMap((output) =>
    (output.channels || []).map((channel) => ({
      key: channelKey(output, channel.index),
      label: channel.label,
    }))
  );

  const advancedFields = source.block?.settingsSchema || [];
  const advancedValue = (field) =>
    settings.advanced?.[field.key] ?? field.default ?? "";
  const setAdvanced = (field, value) =>
    patchSettings({ advanced: { ...settings.advanced, [field.key]: value } });

  return (
    <Panel
      title={`${source.label || source.block?.title} ${t("settings", "Settings")}`}
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
      {channels.length ? (
        <>
          <h3 style={SECTION_TITLE_STYLE}>{t("outputs", "Outputs")}</h3>
          <p style={HELP_STYLE}>
            {t(
              "outputsHint",
              "Filter out the outputs this visual won't use. Hidden outputs can't be mapped to a parameter."
            )}
          </p>
          <div style={CHIPS_STYLE}>
            {channels.map((channel) => {
              const included = !excluded.has(channel.key);
              return (
                <Chip
                  key={channel.key}
                  label={channel.label}
                  selected={included}
                  pressed={included}
                  accent="tertiary"
                  disabled={!canEdit}
                  leading={included ? <CheckIcon width={18} height={18} /> : undefined}
                  onClick={() => toggleChannel(channel.key)}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {advancedFields.length ? (
        <>
          <h3 style={SECTION_TITLE_STYLE}>
            {t("advancedOptions", "Advanced Options")}
          </h3>
          {advancedFields.map((field) => (
            <div key={field.key} style={FIELD_STYLE}>
              <span style={HELP_STYLE}>{field.label}</span>
              {field.type === "boolean" ? (
                <Checkbox
                  checked={advancedValue(field) === true}
                  disabled={!canEdit}
                  ariaLabel={field.label}
                  onChange={(next) => setAdvanced(field, next)}
                />
              ) : field.type === "select" ? (
                <DropdownSelect
                  portal
                  value={String(advancedValue(field))}
                  disabled={!canEdit}
                  ariaLabel={field.label}
                  options={(field.options || []).map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  onChange={(next) => setAdvanced(field, next)}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    aria-label={field.label}
                    value={String(advancedValue(field))}
                    disabled={!canEdit}
                    onChange={(next) =>
                      setAdvanced(field, field.type === "number" ? Number(next) : next)
                    }
                  />
                  {field.unit ? <span style={HELP_STYLE}>{field.unit}</span> : null}
                </div>
              )}
            </div>
          ))}
        </>
      ) : null}

      {canEdit ? (
        <div>
          <Button
            variant="text"
            tone="tertiary"
            leadingIcon={<LinkOffIcon />}
            onClick={() => unlinkSource(source)}
          >
            {t("unlink", "Unlink")}
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}
