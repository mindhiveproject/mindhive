"use client";

import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import Slider from "../../../DesignSystem/Slider";
import {
  AddIcon,
  InfoIcon,
  LinkOffIcon,
  SettingsIcon,
  TuneIcon,
  WaveformIcon,
} from "../../../DesignSystem/Icons";

import { useVisualBuilder } from "../../Context/VisualBuilderContext";
import { bindingFor, labelFor, typeLabel } from "../../Helpers/bindings";
import { addParameter } from "../../Runtime/parametersFile";

// MH-Theme/Additional Accent — the banner is the Parameters tab talking about
// itself, so it is painted in the tab's own hue rather than the platform's.
const BANNER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 8,
  background: "var(--MH-Theme-Additional-Accent-Light, #F5F2FF)",
  color: "var(--MH-Theme-Additional-Accent-Dark, #3F288F)",
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
};

const CARD_STYLE = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  borderRadius: 12,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  transition: "background-color 0.2s",
};

// Selected and expanded look the same on purpose: both mean "this is the row
// you are working on", and a row can be either without being the other.
const CARD_ACTIVE_STYLE = {
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "12px 16px",
};

const NAME_BLOCK_STYLE = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1 1 auto",
};

// MH-Theme/title/base
const NAME_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// MH-Theme/body/base
const TYPE_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0,
};

const DIVIDER_STYLE = {
  height: 1,
  width: "100%",
  border: 0,
  margin: 0,
  background: "var(--MH-Theme-Neutrals-Light, #E6E6E6)",
};

const CONTROLS_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 16,
};

const MAPPED_NOTE_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 8,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The Unmap button is outlined in the text colour rather than a brand one: it
// undoes something rather than advancing anything.
const UNMAP_STYLE = {
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  border: "1px solid var(--MH-Theme-Neutrals-Black, #171717)",
};

const FIELD_STYLE = { display: "flex", flexDirection: "column", gap: 4 };

const FIELD_LABEL_STYLE = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const EMPTY_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// The three looks a parameter's map chip takes. All three are 8px-radius chips
// of the same size; what changes is whether the row has a value coming in.
const CHIP_MANUAL_STYLE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  backgroundColor: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
};
const CHIP_MAPPED_STYLE = {
  ...CHIP_MANUAL_STYLE,
  paddingLeft: 8,
};
// Dashed, because there is nothing there yet — the chip is an invitation rather
// than a value.
const CHIP_UNMAPPED_STYLE = {
  border: "1px dashed var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
};

/**
 * The Parameters tab.
 *
 * The list renders the sketch's declaration — name, data type and default are
 * the code's to own, so they appear here but aren't edited here. What *is*
 * edited here is everything the code can't know: where a parameter's value
 * comes from, and the plumbing around it.
 *
 * A row carries two independent states. *Selected* means the detail panel to
 * the right is pointed at it. *Expanded* means its own controls are open below
 * it. Either one tints the row; the tune button only reflects the second.
 */
export default function ParametersPanel() {
  const { t } = useTranslation("visuals");
  const {
    visual,
    canEdit,
    declared,
    hasDeclaration,
    bindings,
    updateBinding,
    values,
    files,
    updateFile,
    openPanel,
    revealFile,
    detailKey,
  } = useVisualBuilder();

  const [expanded, setExpanded] = useState(null);

  const keys = Object.keys(declared || {});
  const unmapped = keys.filter((key) => !bindingFor(bindings, key).mapping);
  const showAuthoredBanner =
    visual?.participationMode === "authored" && unmapped.length > 0;

  const parametersFile = files.find((file) => file.role === "parameters");

  function onAddNew() {
    if (!parametersFile) return;
    // Names live in code, so a new parameter gets a placeholder key here and is
    // renamed where it is declared — rather than this panel owning a name the
    // file would then have to be kept in sync with.
    let index = keys.length + 1;
    while (keys.includes(`parameter${index}`)) index += 1;
    const key = `parameter${index}`;

    updateFile(
      parametersFile.id,
      addParameter(parametersFile.content || "", key, {
        type: "number",
        label: `Parameter ${index}`,
        default: 0,
        min: 0,
        max: 1,
      })
    );
    revealFile(parametersFile.id);
  }

  return (
    <Panel
      title={t("parameters", "Parameters")}
      actions={
        canEdit ? (
          <Button
            variant="filled"
            tone="accent"
            leadingIcon={<AddIcon />}
            onClick={onAddNew}
            disabled={!parametersFile}
          >
            {t("addNew", "Add New")}
          </Button>
        ) : null
      }
    >
      {showAuthoredBanner ? (
        <div style={BANNER_STYLE} role="status">
          <span style={{ flex: "1 1 auto", minWidth: 0 }}>
            {t(
              "authoredNeedsMapping",
              "Authored mode requires all parameters to have a default mapping to work properly."
            )}
          </span>
          <span style={{ flexShrink: 0, display: "flex" }} aria-hidden>
            <InfoIcon />
          </span>
        </div>
      ) : null}

      {!hasDeclaration ? (
        <p style={EMPTY_STYLE}>
          {t("waitingForSketch", "Waiting for the sketch to declare its parameters…")}
        </p>
      ) : keys.length === 0 ? (
        <p style={EMPTY_STYLE}>
          {t(
            "noParameters",
            "This sketch doesn't declare any parameters yet. Add one to expose a control."
          )}
        </p>
      ) : (
        keys.map((key) => {
          const declaration = declared[key];
          const binding = bindingFor(bindings, key);
          const isExpanded = expanded === key;
          const isSelected = detailKey === key;

          return (
            <div
              key={key}
              className="Visuals-ParameterCard"
              style={{
                ...CARD_STYLE,
                ...(isExpanded || isSelected ? CARD_ACTIVE_STYLE : null),
              }}
            >
              <div style={ROW_STYLE}>
                <div style={NAME_BLOCK_STYLE}>
                  <p style={NAME_STYLE}>{labelFor(key, declaration)}</p>
                  <p style={TYPE_STYLE}>{typeLabel(declaration?.type)}</p>
                </div>

                <div style={ACTIONS_STYLE}>
                  <span style={{ padding: "0 4px" }}>
                    <MapChip
                      binding={binding}
                      onClick={() =>
                        openPanel({ paramKey: key, initialTab: "mapping" })
                      }
                    />
                  </span>

                  <IconButton
                    variant="text"
                    tone="accent"
                    elevated={false}
                    icon={<SettingsIcon />}
                    ariaLabel={t("parameterSettings", "Parameter settings")}
                    onClick={() =>
                      openPanel({ paramKey: key, initialTab: "settings" })
                    }
                  />
                  <IconButton
                    variant={isExpanded ? "filled" : "text"}
                    tone="accent"
                    elevated={false}
                    icon={<TuneIcon />}
                    style={isExpanded ? { transform: "rotate(180deg)" } : undefined}
                    ariaLabel={t("toggleControls", "Show controls")}
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded(isExpanded ? null : key)}
                  />
                </div>
              </div>

              {isExpanded ? (
                <>
                  <hr style={DIVIDER_STYLE} />
                  <div style={CONTROLS_STYLE}>
                    <ManualControls
                      paramKey={key}
                      declaration={declaration}
                      binding={binding}
                      value={values[key]}
                      canEdit={canEdit}
                      updateBinding={updateBinding}
                    />
                  </div>
                </>
              ) : null}
            </div>
          );
        })
      )}
    </Panel>
  );
}

/**
 * The chip that says where a parameter's value comes from, and opens the
 * mapping panel when clicked.
 *
 * A stream binding gets the waveform glyph, but only reads as live when the
 * stream is actually running — which, until data sources land, it never is.
 */
function MapChip({ binding, onClick }) {
  const { t } = useTranslation("visuals");
  const mapping = binding.mapping;

  if (!mapping) {
    return (
      <Chip
        shape="square"
        label={t("mapADataSource", "Map a data source")}
        style={CHIP_UNMAPPED_STYLE}
        onClick={onClick}
      />
    );
  }

  if (mapping.kind === "manual") {
    return (
      <Chip
        shape="square"
        label={t("manualValue", "Manual value")}
        style={CHIP_MANUAL_STYLE}
        onClick={onClick}
      />
    );
  }

  // The mockups also draw a live variant, tinted Light Green. Nothing can be
  // live yet — `resolveValues` deliberately falls back to the declared default
  // for a stream binding rather than pretending — so a mapped chip stays in the
  // resting look until there is a running stream to read it from.
  return (
    <Chip
      shape="square"
      label={mapping.streamID}
      leading={<WaveformIcon width={18} height={18} />}
      style={CHIP_MAPPED_STYLE}
      title={t("notStreaming", "Not streaming")}
      onClick={onClick}
    />
  );
}

/**
 * A parameter's own controls, opened from the tune button.
 *
 * The control is chosen by data type, because that is the only thing that makes
 * a value editable by hand: a number with a declared range is a slider, the
 * same number without one is a field, and a colour is a swatch. A parameter fed
 * by a stream keeps its control visible but inert, so the row still shows what
 * the sketch is receiving.
 */
function ManualControls({
  paramKey,
  declaration,
  binding,
  value,
  canEdit,
  updateBinding,
}) {
  const { t } = useTranslation("visuals");

  const streamed = !!binding.mapping && binding.mapping.kind !== "manual";
  const disabled = !canEdit || streamed;
  const setValue = (next) =>
    updateBinding(paramKey, { mapping: { kind: "manual", value: next } });

  return (
    <>
      {streamed ? (
        <div style={MAPPED_NOTE_STYLE}>
          <span style={{ flex: "1 1 auto", minWidth: 0 }}>
            {t("controlledByData", "The parameter is controlled by your data")}
          </span>
          <Button
            variant="outline"
            style={UNMAP_STYLE}
            leadingIcon={<LinkOffIcon />}
            disabled={!canEdit}
            onClick={() => updateBinding(paramKey, { mapping: null })}
          >
            {t("unmap", "Unmap")}
          </Button>
        </div>
      ) : null}

      <ValueControl
        declaration={declaration}
        binding={binding}
        value={value}
        disabled={disabled}
        onChange={setValue}
      />
    </>
  );
}

function ValueControl({ declaration, binding, value, disabled, onChange }) {
  const { t } = useTranslation("visuals");
  const label = t("value", "Value");
  const type = declaration?.type || "number";

  // An override set in the detail panel is the range the author means; the
  // declaration's is what the sketch shipped with.
  const min = binding.rangeOverride?.min ?? declaration?.min;
  const max = binding.rangeOverride?.max ?? declaration?.max;
  const ranged = Number.isFinite(Number(min)) && Number.isFinite(Number(max));

  if (type === "boolean") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...FIELD_LABEL_STYLE, flex: "1 1 auto" }}>{label}</span>
        <Checkbox
          tone="accent"
          checked={!!value}
          disabled={disabled}
          ariaLabel={label}
          onChange={onChange}
        />
      </div>
    );
  }

  if (type === "color") {
    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        <input
          type="color"
          value={typeof value === "string" ? value : "#000000"}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: 40,
            padding: 4,
            borderRadius: 8,
            border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
            background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
            cursor: disabled ? "default" : "pointer",
          }}
        />
      </div>
    );
  }

  if (type === "string") {
    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        <Input
          aria-label={label}
          value={value == null ? "" : String(value)}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    );
  }

  if (type === "vector2" || type === "vector3") {
    const size = type === "vector2" ? 2 : 3;
    const axes = ["x", "y", "z"].slice(0, size);
    const current = Array.isArray(value) ? value : new Array(size).fill(0);
    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        <div style={{ display: "flex", gap: 12 }}>
          {axes.map((axis, index) => (
            <Input
              key={axis}
              type="number"
              placeholder={axis.toUpperCase()}
              aria-label={`${label} ${axis.toUpperCase()}`}
              value={current[index] == null ? "" : String(current[index])}
              disabled={disabled}
              onChange={(next) => {
                const updated = [...current];
                updated[index] = next === "" ? 0 : Number(next);
                onChange(updated);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (ranged) {
    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        <Slider
          tone="accent"
          min={Number(min)}
          max={Number(max)}
          step={type === "integer" ? 1 : undefined}
          value={Number.isFinite(Number(value)) ? Number(value) : Number(min)}
          disabled={disabled}
          ariaLabel={label}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div style={FIELD_STYLE}>
      <span style={FIELD_LABEL_STYLE}>{label}</span>
      <Input
        type="number"
        step={type === "integer" ? 1 : "any"}
        aria-label={label}
        value={value == null ? "" : String(value)}
        disabled={disabled}
        onChange={(next) => onChange(next === "" ? 0 : Number(next))}
      />
    </div>
  );
}
