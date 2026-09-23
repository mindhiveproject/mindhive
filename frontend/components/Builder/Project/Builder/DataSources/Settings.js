"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";

import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Checkbox from "../../../../DesignSystem/Checkbox";
import Chip from "../../../../DesignSystem/Chip";
import Input from "../../../../DesignSystem/Input";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { ArrowDropDownIcon, CheckIcon, CloseIcon, EditIcon, LinkOffIcon } from "../../../../DesignSystem/Icons";

import { STUDY_DATA_SOURCES } from "../../../../Queries/DataSourceBlock";
import {
  UPDATE_STUDY_DATA_SOURCE,
  DELETE_STUDY_DATA_SOURCE,
} from "../../../../Mutations/DataSourceBlock";
import { channelKey } from "../../../../../lib/yqOutputs";

const DEFAULT_SETTINGS = {
  viewSignal: false,
  streamToNextBlock: true,
  recordParticipantData: true,
  excludedChannels: [],
  advanced: {},
};

// Every terminal channel a block produces, flattened out of its per-stream
// shape for the Outputs chip list.
function flattenOutputs(block) {
  const channels = [];
  (block?.outputs || []).forEach((stream) => {
    (stream?.channels || []).forEach((channel) => {
      channels.push({
        key: channelKey(stream, channel.index),
        label: channel.label,
      });
    });
  });
  return channels;
}

/**
 * Per-instance settings for one linked data source (Figma node 430-2782).
 * Builder.js swaps this into the side panel (sidepanelMode "dataSource") when
 * a source is picked from the persistent panel or the link modal's gear icon,
 * using the same blockPanel header/body shell as a block's panel. Closing it
 * returns the side panel to its regular tabs.
 */
export default function DataSourceSettings({
  study,
  studyDataSourceId,
  onClose,
  onOpenStudyFlow,
}) {
  const { t } = useTranslation("builder");
  const [openSections, setOpenSections] = useState({
    general: true,
    outputs: true,
    advanced: true,
  });

  // Shares the cache entry Panel/LinkModal/Main already populate for this
  // study — no extra network round trip in the common case.
  const { data, refetch } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId: study?.id },
    skip: !study?.id,
  });
  const source = (data?.studyDataSources || []).find(
    (row) => row.id === studyDataSourceId
  );

  const [updateStudyDataSource] = useMutation(UPDATE_STUDY_DATA_SOURCE);
  const [deleteStudyDataSource] = useMutation(DELETE_STUDY_DATA_SOURCE);

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const closeButton = (
    <IconButton
      variant="subtle"
      elevated={false}
      icon={<CloseIcon />}
      ariaLabel={t("dataSources.settings.close", {}, { default: "Close" })}
      title={t("dataSources.settings.close", {}, { default: "Close" })}
      onClick={onClose}
    />
  );

  if (!source) {
    return (
      <div className="blockPanel">
        <div className="blockPanelHeader">
          <p className="blockPanelLoading">
            {t("dataSources.settings.notFound", {}, {
              default: "This data source is no longer linked to the study.",
            })}
          </p>
          {closeButton}
        </div>
      </div>
    );
  }

  const settings = { ...DEFAULT_SETTINGS, ...(source.settings || {}) };
  const patchSettings = (patch) => {
    updateStudyDataSource({
      variables: { id: source.id, data: { settings: { ...settings, ...patch } } },
    });
  };

  const channels = flattenOutputs(source.block);
  const excludedChannels = new Set(settings.excludedChannels || []);
  const toggleChannel = (key) => {
    const next = new Set(excludedChannels);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    patchSettings({ excludedChannels: Array.from(next) });
  };

  const advancedFields = source.block?.settingsSchema || [];
  const getAdvancedValue = (field) =>
    settings.advanced?.[field.key] ?? field.default ?? "";
  const setAdvancedValue = (field, value) => {
    patchSettings({ advanced: { ...settings.advanced, [field.key]: value } });
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        t("dataSources.settings.confirmUnlink", {}, {
          default: "Unlink this data source from the study?",
        })
      )
    )
      return;
    await deleteStudyDataSource({ variables: { id: source.id } });
    await refetch();
    onClose();
  };

  const sectionHeader = (key, label) => (
    <button
      type="button"
      className="dataSourceSettingsSectionHeader"
      aria-expanded={openSections[key]}
      onClick={() => toggleSection(key)}
    >
      <h2>{label}</h2>
      <span
        aria-hidden
        className={clsx(
          "dataSourceSettingsChevron",
          openSections[key] && "dataSourceSettingsChevron--open"
        )}
      >
        <ArrowDropDownIcon />
      </span>
    </button>
  );

  const toggleRow = (key, label, hint) => (
    <div className="dataSourceSettingsToggle">
      <div className="dataSourceSettingsToggleText">
        <p>{label}</p>
        <p className="blockPanelMuted">{hint}</p>
      </div>
      <Checkbox
        checked={settings[key]}
        onChange={(next) => patchSettings({ [key]: next })}
        ariaLabel={label}
      />
    </div>
  );

  return (
    <div className="blockPanel">
      <div className="blockPanelHeader">
        <div className="blockPanelTitle dataSourceSettingsTitle">
          <p className="blockPanelMuted">
            {t("dataSources.settings.eyebrow", {}, { default: "Data source" })}
          </p>
          <h1>
            {t("dataSources.settings.title", { title: source.label || source.block?.title }, {
              default: "{{title}} Settings",
            })}
          </h1>
        </div>
        <div className="blockPanelHeaderMain">{closeButton}</div>
      </div>

      <div className="blockPanelBody">
        <div className="dataSourceSettingsNotice">
          <p>
            {t("dataSources.settings.editNotice", {}, {
              default:
                "To change how the data is aggregated, add more inputs, or add more analysis steps, you must edit this block.",
            })}
          </p>
          <div>
            <Button variant="filled" leadingIcon={<EditIcon />} disabled>
              {t("dataSources.settings.copyAndEdit", {}, { default: "Copy & Edit" })}
            </Button>
          </div>
        </div>

        <section className="dataSourceSettingsSection">
          <p className="blockPanelMuted">
            {t("dataSources.settings.linkedBlocksHint", {}, {
              default:
                "Change which blocks this data source is linked to from the Study Flow.",
            })}
          </p>
          <div>
            <Button variant="outline" onClick={onOpenStudyFlow}>
              {t("dataSources.settings.goToStudyFlow", {}, {
                default: "Go to Study Flow",
              })}
            </Button>
          </div>
        </section>

        <section className="dataSourceSettingsSection">
          {sectionHeader(
            "general",
            t("dataSources.settings.general", {}, { default: "General" })
          )}
          {openSections.general && (
            <>
              {/* viewSignal toggle hidden (stays false) until the participant
                  data preview is finished. */}
              {toggleRow(
                "streamToNextBlock",
                t("dataSources.settings.streamToNextBlock", {}, {
                  default: "Stream the output to the next block",
                }),
                t("dataSources.settings.streamToNextBlockHint", {}, {
                  default:
                    "After calculating aggregate data, stream the output to the next block",
                })
              )}
              <div className="dataSourceSettingsRecord">
                {toggleRow(
                  "recordParticipantData",
                  t("dataSources.settings.recordParticipantData", {}, {
                    default: "Record participant data",
                  }),
                  t("dataSources.settings.recordParticipantDataHint", {}, {
                    default: "Save the device's output as part of your dataset.",
                  })
                )}
              </div>
            </>
          )}
        </section>

        {channels.length > 0 && (
          <section className="dataSourceSettingsSection">
            {sectionHeader(
              "outputs",
              t("dataSources.settings.outputs", {}, { default: "Outputs" })
            )}
            {openSections.outputs && (
              <>
                <p className="blockPanelMuted">
                  {t("dataSources.settings.outputsHint", {}, {
                    default:
                      "Review the outputs of the device and filter out the ones you won't be using.",
                  })}
                </p>
                <div className="dataSourceSettingsChips">
                  {channels.map((channel) => {
                    const included = !excludedChannels.has(channel.key);
                    return (
                      <Chip
                        key={channel.key}
                        label={channel.label}
                        selected={included}
                        pressed={included}
                        accent="tertiary"
                        leading={
                          included ? <CheckIcon width={18} height={18} /> : undefined
                        }
                        onClick={() => toggleChannel(channel.key)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {advancedFields.length > 0 && (
          <section className="dataSourceSettingsSection">
            {sectionHeader(
              "advanced",
              t("dataSources.settings.advancedOptions", {}, { default: "Advanced Options" })
            )}
            {openSections.advanced &&
              advancedFields.map((field) => (
                <div key={field.key} className="dataSourceSettingsField">
                  <p>{field.label}</p>
                  {field.type === "boolean" ? (
                    <Checkbox
                      checked={getAdvancedValue(field) === true}
                      onChange={(next) => setAdvancedValue(field, next)}
                      ariaLabel={field.label}
                    />
                  ) : field.type === "select" ? (
                    <DropdownSelect
                      value={String(getAdvancedValue(field))}
                      onChange={(next) => setAdvancedValue(field, next)}
                      options={(field.options || []).map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      ariaLabel={field.label}
                    />
                  ) : (
                    <div className="dataSourceSettingsFieldRow">
                      <Input
                        type={field.type === "number" ? "number" : "text"}
                        value={String(getAdvancedValue(field))}
                        onChange={(next) =>
                          setAdvancedValue(
                            field,
                            field.type === "number" ? Number(next) : next
                          )
                        }
                      />
                      {field.unit && <p className="blockPanelMuted">{field.unit}</p>}
                    </div>
                  )}
                </div>
              ))}
          </section>
        )}

        <section className="dataSourceSettingsSection">
          <div>
            <Button
              variant="text"
              tone="tertiary"
              leadingIcon={<LinkOffIcon />}
              onClick={handleDelete}
            >
              {t("dataSources.unlinkLabel", {}, { default: "Unlink" })}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
