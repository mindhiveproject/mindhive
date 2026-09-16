"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Checkbox from "../../../../DesignSystem/Checkbox";
import Chip from "../../../../DesignSystem/Chip";
import Input from "../../../../DesignSystem/Input";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { ArrowDropDownIcon, CloseIcon, DeleteIcon, EditIcon } from "../../../../DesignSystem/Icons";

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

const HEADER_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const TITLE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const NOTICE_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  borderRadius: 8,
  background: "var(--MH-Theme-Tertiary-Light, #F6F9F8)",
};

const NOTICE_TEXT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Tertiary-Dark, #0D3944)",
};

const DIVIDER_STYLE = {
  height: 1,
  width: "100%",
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const SECTION_HINT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const TOGGLE_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
};

const TOGGLE_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
};

const TOGGLE_LABEL_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const TOGGLE_HINT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const RECORD_BOX_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const CHIP_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  width: "100%",
};

const FIELD_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: "100%",
};

const FIELD_LABEL_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const FIELD_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
};

const FIELD_UNIT_STYLE = {
  margin: 0,
  flexShrink: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const DELETE_BUTTON_STYLE = {
  color: "var(--MH-Theme-Warning-Base, #B9261A)",
};

/**
 * Per-instance settings for one linked data source (Figma node 430-2782).
 * Lives in the study builder's right sidebar as its own tab, appearing while
 * a data source is selected from the persistent panel or the link modal's
 * gear icon — closing it (the X here) goes back to the sidebar's normal tabs.
 */
export default function DataSourceSettingsTab({ study, studyDataSourceId, onClose }) {
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

  if (!source) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
        <div style={HEADER_ROW_STYLE}>
          <p className="MH-Type-Body-Base" style={TOGGLE_HINT_STYLE}>
            {t("dataSources.settings.notFound", {}, {
              default: "This data source is no longer linked to the study.",
            })}
          </p>
          <IconButton
            variant="neutral"
            icon={<CloseIcon />}
            ariaLabel={t("dataSources.settings.close", {}, { default: "Close" })}
            onClick={onClose}
          />
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

  const deleteLabel = t("dataSources.settings.delete", {}, {
    default: "Remove Data Source",
  });
  const handleDelete = async () => {
    if (
      !window.confirm(
        t("dataSources.settings.confirmDelete", {}, {
          default: "Remove this data source from the study?",
        })
      )
    )
      return;
    await deleteStudyDataSource({ variables: { id: source.id } });
    await refetch();
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
      <div style={HEADER_ROW_STYLE}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <p className="MH-Type-Body-Base" style={TOGGLE_HINT_STYLE}>
            {t("dataSources.settings.eyebrow", {}, { default: "Data source" })}
          </p>
          <h2 className="MH-Type-Title-Large" style={TITLE_STYLE}>
            {t("dataSources.settings.title", { title: source.label || source.block?.title }, {
              default: "{{title}} Settings",
            })}
          </h2>
        </div>
        <IconButton
          variant="neutral"
          icon={<CloseIcon />}
          ariaLabel={t("dataSources.settings.close", {}, { default: "Close" })}
          onClick={onClose}
        />
      </div>

      <div style={NOTICE_STYLE}>
        <p className="MH-Type-Body-Base" style={NOTICE_TEXT_STYLE}>
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

      <div style={DIVIDER_STYLE} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        <button
          type="button"
          style={SECTION_HEADER_STYLE}
          onClick={() => toggleSection("general")}
        >
          <span className="MH-Type-Title-Base" style={SECTION_TITLE_STYLE}>
            {t("dataSources.settings.general", {}, { default: "General" })}
          </span>
          <span
            aria-hidden
            style={{
              display: "flex",
              transform: openSections.general ? "rotate(180deg)" : "none",
            }}
          >
            <ArrowDropDownIcon />
          </span>
        </button>

        {openSections.general && (
          <>
            <div style={TOGGLE_ROW_STYLE}>
              <div style={TOGGLE_TEXT_STYLE}>
                <p className="MH-Type-Body-Base" style={TOGGLE_LABEL_STYLE}>
                  {t("dataSources.settings.viewSignal", {}, {
                    default: "Allow participants to view the signal",
                  })}
                </p>
                <p className="MH-Type-Body-Base" style={TOGGLE_HINT_STYLE}>
                  {t("dataSources.settings.viewSignalHint", {}, {
                    default: "View the raw signal during participation.",
                  })}
                </p>
              </div>
              <Checkbox
                checked={settings.viewSignal}
                onChange={(next) => patchSettings({ viewSignal: next })}
                ariaLabel={t("dataSources.settings.viewSignal", {}, {
                  default: "Allow participants to view the signal",
                })}
              />
            </div>

            <div style={TOGGLE_ROW_STYLE}>
              <div style={TOGGLE_TEXT_STYLE}>
                <p className="MH-Type-Body-Base" style={TOGGLE_LABEL_STYLE}>
                  {t("dataSources.settings.streamToNextBlock", {}, {
                    default: "Stream the output to the next block",
                  })}
                </p>
                <p className="MH-Type-Body-Base" style={TOGGLE_HINT_STYLE}>
                  {t("dataSources.settings.streamToNextBlockHint", {}, {
                    default:
                      "After calculating aggregate data, stream the output to the next block",
                  })}
                </p>
              </div>
              <Checkbox
                checked={settings.streamToNextBlock}
                onChange={(next) => patchSettings({ streamToNextBlock: next })}
                ariaLabel={t("dataSources.settings.streamToNextBlock", {}, {
                  default: "Stream the output to the next block",
                })}
              />
            </div>

            <div style={RECORD_BOX_STYLE}>
              <div style={TOGGLE_ROW_STYLE}>
                <div style={TOGGLE_TEXT_STYLE}>
                  <p className="MH-Type-Body-Base" style={TOGGLE_LABEL_STYLE}>
                    {t("dataSources.settings.recordParticipantData", {}, {
                      default: "Record participant data",
                    })}
                  </p>
                  <p className="MH-Type-Body-Base" style={TOGGLE_HINT_STYLE}>
                    {t("dataSources.settings.recordParticipantDataHint", {}, {
                      default: "Save the device's output as part of your dataset.",
                    })}
                  </p>
                </div>
                <Checkbox
                  checked={settings.recordParticipantData}
                  onChange={(next) => patchSettings({ recordParticipantData: next })}
                  ariaLabel={t("dataSources.settings.recordParticipantData", {}, {
                    default: "Record participant data",
                  })}
                />
              </div>
              <div style={TOGGLE_ROW_STYLE}>
                <div style={TOGGLE_TEXT_STYLE}>
                  <p className="MH-Type-Body-Base" style={TOGGLE_LABEL_STYLE}>
                    {t("dataSources.settings.downloadToComputer", {}, {
                      default: "Download to computer",
                    })}
                  </p>
                </div>
                <Checkbox checked={false} disabled ariaLabel={t(
                  "dataSources.settings.downloadToComputer",
                  {},
                  { default: "Download to computer" }
                )} />
              </div>
            </div>
          </>
        )}
      </div>

      {channels.length > 0 && (
        <>
          <div style={DIVIDER_STYLE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <button
              type="button"
              style={SECTION_HEADER_STYLE}
              onClick={() => toggleSection("outputs")}
            >
              <span className="MH-Type-Title-Base" style={SECTION_TITLE_STYLE}>
                {t("dataSources.settings.outputs", {}, { default: "Outputs" })}
              </span>
              <span
                aria-hidden
                style={{
                  display: "flex",
                  transform: openSections.outputs ? "rotate(180deg)" : "none",
                }}
              >
                <ArrowDropDownIcon />
              </span>
            </button>
            {openSections.outputs && (
              <>
                <p className="MH-Type-Body-Base" style={SECTION_HINT_STYLE}>
                  {t("dataSources.settings.outputsHint", {}, {
                    default:
                      "Review the outputs of the device and filter out the ones you won't be using.",
                  })}
                </p>
                <div style={CHIP_ROW_STYLE}>
                  {channels.map((channel) => {
                    const excluded = excludedChannels.has(channel.key);
                    return (
                      <Chip
                        key={channel.key}
                        label={channel.label}
                        onClick={() => toggleChannel(channel.key)}
                        style={{
                          background: excluded
                            ? "var(--MH-Theme-Neutrals-White, #FFFFFF)"
                            : "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                          borderColor: "var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
                        }}
                        labelStyle={{
                          textDecoration: excluded ? "line-through" : "none",
                          color: excluded
                            ? "var(--MH-Theme-Neutrals-Medium, #A1A1A1)"
                            : "var(--MH-Theme-Neutrals-Black, #171717)",
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {advancedFields.length > 0 && (
        <>
          <div style={DIVIDER_STYLE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <button
              type="button"
              style={SECTION_HEADER_STYLE}
              onClick={() => toggleSection("advanced")}
            >
              <span className="MH-Type-Title-Base" style={SECTION_TITLE_STYLE}>
                {t("dataSources.settings.advancedOptions", {}, { default: "Advanced Options" })}
              </span>
              <span
                aria-hidden
                style={{
                  display: "flex",
                  transform: openSections.advanced ? "rotate(180deg)" : "none",
                }}
              >
                <ArrowDropDownIcon />
              </span>
            </button>
            {openSections.advanced &&
              advancedFields.map((field) => (
                <div key={field.key} style={FIELD_STYLE}>
                  <p className="MH-Type-Body-Base" style={FIELD_LABEL_STYLE}>
                    {field.label}
                  </p>
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
                    <div style={FIELD_ROW_STYLE}>
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
                      {field.unit && (
                        <p className="MH-Type-Body-Base" style={FIELD_UNIT_STYLE}>
                          {field.unit}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}

      <div style={DIVIDER_STYLE} />
      <div>
        <Button
          variant="text"
          leadingIcon={<DeleteIcon />}
          onClick={handleDelete}
          style={DELETE_BUTTON_STYLE}
        >
          {deleteLabel}
        </Button>
      </div>
    </div>
  );
}
