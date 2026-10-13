"use client";

import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import {
  ArrowDropDownIcon,
  CableIcon,
  CloseIcon,
  CodeIcon,
  DeleteIcon,
  SettingsIcon,
} from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import {
  EMPTY_BINDING,
  KIND_LABELS,
  bindingFor,
  isNumeric,
  isStreamMappable,
  kindOf,
  labelFor,
  normalizeDeclarations,
  retype,
} from "../../Helpers/bindings";
import { removeParameter, updateParameter } from "../../Runtime/parametersFile";
import { ValueControl } from "./Parameters";
import { StatusIndicator } from "../../../Studies/Run/DataSources/ConnectScreen";
import { channelKey, outputKey } from "../../../../lib/yqOutputs";

const ROOT_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  overflow: "hidden",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
  padding: "20px 16px 16px",
};

// MH-Theme/title/large
const HEADER_TITLE_STYLE = {
  margin: 0,
  flex: "1 1 auto",
  minWidth: 0,
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const DIVIDER_STYLE = {
  height: 1,
  width: "100%",
  border: 0,
  margin: 0,
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

// The two views are buttons rather than a Navbar: they are pills the width of
// their own labels, which is what the underline and tonal navbar variants both
// stop being once there are only two of them.
const TABS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
  padding: "8px 16px",
};

const BODY_STYLE = {
  flex: "1 1 0%",
  minHeight: 0,
  overflowY: "auto",
  padding: "8px 16px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexShrink: 0,
  padding: "16px 16px 20px",
};

// MH-Theme/title/base — a section heading inside the panel body.
const SECTION_TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const SECTION_HEADER_STYLE = {
  ...SECTION_TITLE_STYLE,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

// MH-Theme/body/base. Field labels and the name of a toggle share it — the
// weight difference between a heading and a row label is the only thing
// separating the sections from what is in them.
const LABEL_STYLE = {
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  ...LABEL_STYLE,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const TOGGLE_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const FROM_CODE_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  font: "var(--MH-Type-Body-Small)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const FIELD_STYLE = { display: "flex", flexDirection: "column", gap: 4 };

// The surface a stream group sits on in the mockups; the empty state borrows it
// so the panel keeps its shape whether or not anything is linked.
const STREAMS_BOX_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "8px 16px 12px",
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
  ...HELP_STYLE,
};

const STREAM_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minHeight: 32,
};

const CHIPS_STYLE = { display: "flex", flexWrap: "wrap", gap: 4 };

/** A collapsible heading with the body it controls. */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        style={SECTION_HEADER_STYLE}
        onClick={() => setOpen((on) => !on)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span
          style={{
            display: "flex",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
          aria-hidden
        >
          <ArrowDropDownIcon />
        </span>
      </button>
      {open ? children : null}
    </>
  );
}

/**
 * The per-parameter side panel — another entry in the work area rather than a
 * modal, so the list it was opened from stays visible beside it.
 *
 * Name, Data Type and Default Value belong to the sketch's declaration, so
 * Save writes them back into `parameters.js` rather than keeping a copy of its
 * own — the file stays the one place they are defined. A declaration the
 * panel can't edit safely (a spread, a computed entry) leaves them read-only
 * with the jump to the file. Everything below that line — normalize, range,
 * whether mapping is allowed at all — is data plumbing the dashboard owns.
 */
export default function ParameterDetailPanel({ paramKey, initialTab }) {
  const { t } = useTranslation("visuals");
  const {
    canEdit,
    declared,
    bindings,
    updateBinding,
    files,
    updateFile,
    closePanel,
    revealFile,
    dataSources,
    sourceApis,
    showDataSources,
  } = useVisualBuilder();

  const declaration = declared?.[paramKey];
  const binding = bindingFor(bindings, paramKey);
  const parametersFile = files.find((file) => file.role === "parameters");

  const [tab, setTab] = useState(initialTab || "settings");
  const [name, setName] = useState(labelFor(paramKey, declaration));
  // What the author has changed in the declaration and not yet saved: field →
  // value, in the form `updateParameter` takes. Empty until they touch the
  // type or the default.
  const [fields, setFields] = useState({});
  const [draft, setDraft] = useState({
    normalize: binding.normalize,
    clamp: binding.clamp,
    allowMapping: binding.allowMapping,
    min: binding.rangeOverride?.min ?? "",
    max: binding.rangeOverride?.max ?? "",
  });

  // Re-seed when the panel is pointed at a different parameter without
  // unmounting, so the draft never belongs to the previous one.
  useEffect(() => {
    setName(labelFor(paramKey, declaration));
    setFields({});
    setDraft({
      normalize: binding.normalize,
      clamp: binding.clamp,
      allowMapping: binding.allowMapping,
      min: binding.rangeOverride?.min ?? "",
      max: binding.rangeOverride?.max ?? "",
    });
    setTab(initialTab || "settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // Saving rewrites the file and the sketch re-declares itself a moment later;
  // that declaration is what the changes were waiting to become.
  useEffect(() => setFields({}), [declaration]);

  // Whether the file's entry for this parameter is something that can be
  // edited from here: an empty patch is a dry run of exactly that.
  const content = parametersFile?.content;
  const hasFile = !!parametersFile;
  const editable = useMemo(
    () => hasFile && updateParameter(content || "", paramKey, {}) !== null,
    [content, paramKey, hasFile]
  );

  // The declaration as it will be once saved, so the default's control follows
  // a type picked a moment ago.
  const shown = useMemo(() => {
    if (!declaration) return declaration;
    const merged = { ...declaration, ...fields };
    return normalizeDeclarations({ [paramKey]: merged }).parameters[paramKey];
  }, [declaration, fields, paramKey]);

  // The parameter can vanish underneath this panel — deleted from the file, or
  // renamed in code, which is the same thing as far as the declared key goes.
  useEffect(() => {
    if (!declaration) closePanel();
  }, [declaration, closePanel]);

  if (!declaration) return null;

  function onKind(kind) {
    if (kind === kindOf(shown)) return;
    setFields(retype(shown, kind));
  }

  function onSave() {
    const min = draft.min === "" ? null : Number(draft.min);
    const max = draft.max === "" ? null : Number(draft.max);
    const patch = {
      normalize: draft.normalize,
      clamp: draft.clamp,
      allowMapping: draft.allowMapping,
      rangeOverride: min === null && max === null ? null : { min, max },
    };

    const declarationPatch = { ...fields };
    if (name.trim() !== labelFor(paramKey, declaration)) {
      declarationPatch.label = name.trim() || undefined;
    }
    const next = editable
      ? updateParameter(parametersFile.content || "", paramKey, declarationPatch)
      : null;
    if (next !== null && Object.keys(declarationPatch).length > 0) {
      updateFile(parametersFile.id, next);
      // A value set by hand would keep winning over the default just changed,
      // and a stream can't feed a parameter retyped to something other than a
      // number.
      if (binding.mapping?.kind === "manual" && "default" in fields) {
        patch.mapping = null;
      } else if (
        binding.mapping?.kind === "stream" &&
        "type" in fields &&
        shown.type !== "number"
      ) {
        patch.mapping = null;
      }
    }

    updateBinding(paramKey, patch);
  }

  function onDelete() {
    if (!parametersFile) return;
    updateFile(
      parametersFile.id,
      removeParameter(parametersFile.content || "", paramKey)
    );
    closePanel();
  }

  return (
    <section className="Visuals-ParameterDetail" style={ROOT_STYLE}>
      <header style={HEADER_STYLE}>
        <h2 style={HEADER_TITLE_STYLE}>{labelFor(paramKey, declaration)}</h2>
        <IconButton
          variant="text"
          tone="accent"
          elevated={false}
          icon={<CloseIcon />}
          ariaLabel={t("close", "Close")}
          onClick={closePanel}
        />
      </header>

      <hr style={DIVIDER_STYLE} />

      <div style={TABS_STYLE} role="tablist">
        <Button
          variant={tab === "settings" ? "filled" : "text"}
          tone="accent"
          role="tab"
          aria-selected={tab === "settings"}
          leadingIcon={<SettingsIcon />}
          onClick={() => setTab("settings")}
        >
          {t("settings", "Settings")}
        </Button>
        <Button
          variant={tab === "mapping" ? "filled" : "text"}
          tone="accent"
          role="tab"
          aria-selected={tab === "mapping"}
          leadingIcon={<CableIcon />}
          onClick={() => setTab("mapping")}
        >
          {t("mapping", "Mapping")}
        </Button>
      </div>

      <hr style={DIVIDER_STYLE} />

      {tab === "settings" ? (
        <>
          <div style={BODY_STYLE}>
            <Section title={t("properties", "Properties")}>
              <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>{t("name", "Name")}</span>
                <Input
                  aria-label={t("name", "Name")}
                  value={name}
                  disabled={!editable}
                  onChange={setName}
                />
              </div>
              <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>{t("dataType", "Data Type")}</span>
                <DropdownSelect
                  portal
                  ariaLabel={t("dataType", "Data Type")}
                  disabled={!editable}
                  value={kindOf(shown)}
                  options={Object.entries(KIND_LABELS).map(([value, label]) => ({
                    value,
                    label: t(`kind_${value}`, label),
                  }))}
                  onChange={onKind}
                />
              </div>
              <ValueControl
                label={t("defaultValue", "Default Value")}
                declaration={shown}
                binding={EMPTY_BINDING}
                value={shown.default}
                disabled={!editable}
                onChange={(next) =>
                  setFields((current) => ({ ...current, default: next }))
                }
              />

              <div style={FROM_CODE_STYLE}>
                <span>{t("definedInCode", "Defined in parameters.js")}</span>
                {parametersFile ? (
                  <Button
                    variant="text"
                    tone="accent"
                    leadingIcon={<CodeIcon />}
                    onClick={() => revealFile(parametersFile.id)}
                  >
                    {t("editInCode", "Edit in code")}
                  </Button>
                ) : null}
              </div>

              {/* Ranging means something for numbers and vectors alike. Normalize
                  and Clamp shape a stream sample, and only a number takes one. */}
              {declaration.type === "number" ? (
                <>
                  <div style={TOGGLE_ROW_STYLE}>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <p style={{ ...LABEL_STYLE, margin: 0 }}>
                        {t("normalize", "Normalize")}
                      </p>
                      <p style={{ ...HELP_STYLE, margin: 0 }}>
                        {t(
                          "normalizeHelp",
                          "This will remap the values coming in from their default range to 0 to 1."
                        )}
                      </p>
                    </div>
                    <Checkbox
                      tone="accent"
                      checked={draft.normalize}
                      disabled={!canEdit}
                      ariaLabel={t("normalize", "Normalize")}
                      onChange={(next) =>
                        setDraft((current) => ({ ...current, normalize: next }))
                      }
                    />
                  </div>

                  <div style={TOGGLE_ROW_STYLE}>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <p style={{ ...LABEL_STYLE, margin: 0 }}>
                        {t("clamp", "Clamp")}
                      </p>
                      <p style={{ ...HELP_STYLE, margin: 0 }}>
                        {t(
                          "clampHelp",
                          "Keeps values coming in from a data source inside the range. Otherwise, values past it reach the visual as they are."
                        )}
                      </p>
                    </div>
                    <Checkbox
                      tone="accent"
                      checked={draft.clamp}
                      disabled={!canEdit}
                      ariaLabel={t("clamp", "Clamp")}
                      onChange={(next) =>
                        setDraft((current) => ({ ...current, clamp: next }))
                      }
                    />
                  </div>
                </>
              ) : null}

              {isNumeric(declaration) ? (
                <div style={FIELD_STYLE}>
                  <span style={LABEL_STYLE}>{t("range", "Range")}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Input
                      type="number"
                      placeholder={t("min", "Min")}
                      aria-label={t("min", "Min")}
                      value={draft.min}
                      disabled={!canEdit}
                      onChange={(next) =>
                        setDraft((current) => ({ ...current, min: next }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder={t("max", "Max")}
                      aria-label={t("max", "Max")}
                      value={draft.max}
                      disabled={!canEdit}
                      onChange={(next) =>
                        setDraft((current) => ({ ...current, max: next }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </Section>

            <Section title={t("mapping", "Mapping")}>
              <div style={TOGGLE_ROW_STYLE}>
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <p style={{ ...LABEL_STYLE, margin: 0 }}>
                    {t("allowMapping", "Allow Mapping")}
                  </p>
                  <p style={{ ...HELP_STYLE, margin: 0 }}>
                    {t(
                      "allowMappingHelp",
                      "Lets the parameter be mapped to a device. Otherwise, it will be limited to manual controls."
                    )}
                  </p>
                </div>
                <Checkbox
                  tone="accent"
                  checked={draft.allowMapping}
                  disabled={!canEdit}
                  ariaLabel={t("allowMapping", "Allow Mapping")}
                  onChange={(next) =>
                    setDraft((current) => ({ ...current, allowMapping: next }))
                  }
                />
              </div>
            </Section>
          </div>

          <hr style={DIVIDER_STYLE} />

          <footer style={FOOTER_STYLE}>
            <Button
              variant="text"
              tone="accent"
              leadingIcon={<DeleteIcon />}
              disabled={!canEdit || !parametersFile}
              onClick={onDelete}
            >
              {t("deleteParameter", "Delete Parameter")}
            </Button>
            <Button
              variant="filled"
              tone="accent"
              disabled={!canEdit}
              onClick={onSave}
            >
              {t("save", "Save")}
            </Button>
          </footer>
        </>
      ) : (
        <div style={BODY_STYLE}>
          <h3 style={SECTION_TITLE_STYLE}>
            {t("availableStreams", "Available Streams")}
          </h3>
          <StreamPicker
            paramKey={paramKey}
            declaration={declaration}
            binding={binding}
            canEdit={canEdit}
            dataSources={dataSources || []}
            sourceApis={sourceApis || {}}
            updateBinding={updateBinding}
            showDataSources={showDataSources}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Every output a parameter could be mapped to, grouped by the source it comes
 * from. Picking a channel maps it; picking the mapped one again unmaps it,
 * back to the default rather than to a manual value the author never set.
 *
 * Only numeric outputs are listed, and only for a number parameter — see
 * `isStreamMappable`. A source's outputs are listed whether or not it is
 * streaming, so a mapping can be set up before the device is to hand.
 */
function StreamPicker({
  paramKey,
  declaration,
  binding,
  canEdit,
  dataSources,
  sourceApis,
  updateBinding,
  showDataSources,
}) {
  const { t } = useTranslation("visuals");
  const mapping = binding.mapping?.kind === "stream" ? binding.mapping : null;

  if (!isStreamMappable(declaration, binding)) {
    return (
      <div style={STREAMS_BOX_STYLE}>
        {binding.allowMapping === false
          ? t(
              "mappingTurnedOff",
              "Mapping is turned off for this parameter. Turn on Allow Mapping in its settings to connect it to a device."
            )
          : t(
              "onlyNumbersMap",
              "Only number parameters can be mapped to a device output for now. Set this one by hand from its controls."
            )}
      </div>
    );
  }

  if (dataSources.length === 0) {
    return (
      <div style={STREAMS_BOX_STYLE}>
        <span>
          {t(
            "noSourcesLinked",
            "No data sources are linked to this visual yet. Link one to map its outputs here."
          )}
        </span>
        {showDataSources ? (
          <div>
            <Button variant="text" tone="accent" onClick={showDataSources}>
              {t("goToDataSources", "Go to Data Sources")}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return dataSources.map((source) => {
    const excluded = new Set(source.settings?.excludedChannels || []);
    const outputs = (source.block?.outputs || []).filter(
      (output) => output.valueType !== "categorical"
    );
    const channels = outputs.flatMap((output) =>
      (output.channels || [])
        .filter((channel) => !excluded.has(channelKey(output, channel.index)))
        .map((channel) => ({ output, channel }))
    );

    return (
      <div key={source.id} style={STREAMS_BOX_STYLE}>
        <div style={STREAM_HEADER_STYLE}>
          <span style={{ ...SECTION_TITLE_STYLE, minWidth: 0 }}>
            {source.label || source.block?.title}
          </span>
          <StatusIndicator streaming={!!sourceApis[source.id]?.streaming} />
        </div>
        {channels.length === 0 ? (
          <span>{t("noNumericOutputs", "This source has no numeric outputs to map.")}</span>
        ) : (
          <div style={CHIPS_STYLE}>
            {channels.map(({ output, channel }) => {
              const selected =
                mapping?.sourceId === source.id &&
                mapping?.output === outputKey(output) &&
                mapping?.channel === channel.index;
              return (
                <Chip
                  key={channelKey(output, channel.index)}
                  label={channel.label}
                  selected={selected}
                  pressed={selected}
                  accent="tertiary"
                  disabled={!canEdit}
                  onClick={() =>
                    updateBinding(paramKey, {
                      mapping: selected
                        ? null
                        : {
                            kind: "stream",
                            sourceId: source.id,
                            output: outputKey(output),
                            channel: channel.index,
                          },
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    );
  });
}
