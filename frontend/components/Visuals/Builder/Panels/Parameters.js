"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Button from "../../../DesignSystem/Button";
import ButtonGroup from "../../../DesignSystem/ButtonGroup";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import IconButton from "../../../DesignSystem/IconButton";
import Input from "../../../DesignSystem/Input";
import Modal from "../../../DesignSystem/Modal";
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
import {
  bindingFor,
  isStreamMappable,
  isToggle,
  labelFor,
  typeLabel,
} from "../../Helpers/bindings";
import { addParameter, keyFromName } from "../../Runtime/parametersFile";
import { outputKey } from "../../../../lib/yqOutputs";

// MH-Theme/Additional Accent — a notice is the Parameters tab talking about
// itself, so it is painted in the tab's own hue rather than the platform's.
const BANNER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 8,
  background: "var(--MH-Theme-Additional-Accent-Light, #F5F2FF)",
  color: "var(--MH-Theme-Additional-Accent-Dark, #3F288F)",
  font: "var(--MH-Type-Body-Base)",
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
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// MH-Theme/body/base
const TYPE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
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
  font: "var(--MH-Type-Body-Base)",
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
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const EMPTY_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// A mapped chip's two looks: resting, and live while its source streams. An
// unmapped (or hand-set) parameter is the plain dashed chip, no override.
const CHIP_MAPPED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  backgroundColor: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
};
// Mapped and the source is streaming: the value on the row is live.
const CHIP_LIVE_STYLE = {
  ...CHIP_MAPPED_STYLE,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
  backgroundColor: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
};

/**
 * The Parameters tab.
 *
 * The list renders the sketch's declaration. Adding a parameter, and editing
 * its name, type and default in the detail panel, write straight back into
 * `parameters.js`, which stays the one place they are defined. What the code
 * can't know is kept here instead: where a parameter's value comes from, and
 * the plumbing around it.
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
    declarationWarnings = [],
    bindings,
    updateBinding,
    bus,
    files,
    updateFile,
    openPanel,
    detailKey,
    dataSources,
    sourceApis,
  } = useVisualBuilder();

  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);

  const keys = Object.keys(declared || {});
  const unmapped = keys.filter((key) => !bindingFor(bindings, key).mapping);
  const showAuthoredBanner =
    visual?.participationMode === "authored" && unmapped.length > 0;

  // A stream mapping the parameter can no longer receive: it was retyped in
  // code, or Allow Mapping was switched off after the fact. Nothing feeds it,
  // yet its control stays locked as if something did.
  const stuckMappings = keys.filter((key) => {
    const binding = bindingFor(bindings, key);
    return (
      binding.mapping?.kind === "stream" &&
      !isStreamMappable(declared[key], binding)
    );
  });

  const parametersFile = files.find((file) => file.role === "parameters");

  function onAdd(name, key) {
    updateFile(
      parametersFile.id,
      addParameter(parametersFile.content || "", key, {
        type: "number",
        label: name,
        default: 0,
        min: 0,
        max: 1,
      })
    );
    setAdding(false);
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
            onClick={() => setAdding(true)}
            disabled={!parametersFile}
          >
            {t("addNew", "Add New")}
          </Button>
        ) : null
      }
    >
      {showAuthoredBanner ? (
        <Notice>
          {t(
            "authoredNeedsMapping",
            "Authored mode requires all parameters to have a default mapping to work properly."
          )}
        </Notice>
      ) : null}

      {declarationWarnings.map((message) => (
        <Notice key={message}>{message}</Notice>
      ))}

      {stuckMappings.map((key) => (
        <Notice key={key}>
          {(bindingFor(bindings, key).allowMapping === false
            ? t(
                "stuckMappingOff",
                "“{{name}}” is mapped to a data source, but Allow Mapping is off, so nothing reaches it. Unmap it, or turn Allow Mapping back on."
              )
            : t(
                "stuckMappingType",
                "“{{name}}” is mapped to a data source, but only number parameters can receive one. Unmap it to set it by hand."
              )
          ).replace("{{name}}", labelFor(key, declared[key]))}
        </Notice>
      ))}

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
                  <p style={TYPE_STYLE}>{typeLabel(declaration)}</p>
                </div>

                <div style={ACTIONS_STYLE}>
                  <span style={{ padding: "0 4px" }}>
                    <MapChip
                      binding={binding}
                      dataSources={dataSources || []}
                      sourceApis={sourceApis || {}}
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
                      bus={bus}
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

      <AddParameterModal
        open={adding}
        keys={keys}
        onAdd={onAdd}
        onClose={() => setAdding(false)}
      />
    </Panel>
  );
}

/**
 * Asks what a new parameter is called before anything is written. The name is
 * what the author calls it; the key the sketch reads it by is spelled from it,
 * and shown, so there is nothing left to rename in the code afterwards.
 */
function AddParameterModal({ open, keys, onAdd, onClose }) {
  const { t } = useTranslation("visuals");
  const [name, setName] = useState("");

  // Every opening starts empty rather than with the last name typed.
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const trimmed = name.trim();
  const key = keyFromName(trimmed);
  const error = !trimmed
    ? null
    : !key
    ? t("nameNeedsLetter", "Start the name with a letter.")
    : keys.includes(key)
    ? t("nameTaken", "There is already a parameter called “{{key}}”.").replace(
        "{{key}}",
        key
      )
    : null;
  const ready = !!key && !error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("addParameter", "Add Parameter")}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {t("cancel", "Cancel")}
          </Button>
          <Button
            variant="filled"
            tone="accent"
            disabled={!ready}
            onClick={() => onAdd(trimmed, key)}
          >
            {t("add", "Add")}
          </Button>
        </>
      }
    >
      <Input
        label={t("name", "Name")}
        autoFocus
        value={name}
        invalid={!!error}
        hint={
          error ||
          (ready
            ? t("usedInCode", "Read in your sketch as params.{{key}}").replace(
                "{{key}}",
                key
              )
            : undefined)
        }
        onChange={setName}
        onKeyDown={(event) => {
          if (event.key === "Enter" && ready) onAdd(trimmed, key);
        }}
      />
    </Modal>
  );
}

/** One line of the panel talking about itself, in the panel's own hue. */
function Notice({ children }) {
  return (
    <div style={BANNER_STYLE} role="status">
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</span>
      <span style={{ flexShrink: 0, display: "flex" }} aria-hidden>
        <InfoIcon />
      </span>
    </div>
  );
}

/**
 * A number field that lets a half-typed value be half-typed.
 *
 * What the author is typing is held here as text and only a value that parses
 * is committed, so clearing the field to retype it doesn't snap to 0 and a
 * partial entry never reaches the sketch. An empty field says so rather than
 * quietly keeping the old number; leaving it puts the committed value back.
 */
function NumberField({ value, step, onChange, ...rest }) {
  const { t } = useTranslation("visuals");
  const [draft, setDraft] = useState(null);
  const empty = draft === "";

  return (
    <Input
      type="number"
      step={step ?? "any"}
      value={draft ?? (value == null ? "" : String(value))}
      invalid={empty}
      hint={empty ? t("enterNumber", "Enter a number.") : undefined}
      onChange={(next) => {
        setDraft(next);
        if (next !== "" && Number.isFinite(Number(next))) onChange(Number(next));
      }}
      onBlur={() => setDraft(null)}
      {...rest}
    />
  );
}

/**
 * The chip that says where a parameter's value comes from, and opens the
 * mapping panel when clicked.
 *
 * A value set by hand reads the same as no mapping at all: either way nothing
 * is feeding the parameter, and the dashed chip invites mapping one. The value
 * itself is on show in the row's controls.
 *
 * A stream binding is named by the channel it reads, and tints Light Green
 * only while its source is actually streaming — a mapping to a device nobody
 * has connected is not live, and shouldn't look it.
 */
function MapChip({ binding, dataSources, sourceApis, onClick }) {
  const { t } = useTranslation("visuals");
  const mapping = binding.mapping;

  if (mapping?.kind !== "stream") {
    return (
      <Chip
        dashed
        label={t("mapADataSource", "Map a data source")}
        onClick={onClick}
      />
    );
  }

  const source = dataSources.find((row) => row.id === mapping.sourceId);
  const channel = (source?.block?.outputs || [])
    .find((output) => outputKey(output) === mapping.output)
    ?.channels?.find((entry) => entry.index === mapping.channel);
  const live = !!source && !!sourceApis[source.id]?.streaming;

  return (
    <Chip
      label={channel?.label || t("missingOutput", "Missing output")}
      leading={<WaveformIcon width={18} height={18} />}
      style={live ? CHIP_LIVE_STYLE : CHIP_MAPPED_STYLE}
      title={
        source
          ? `${source.label || source.block?.title} · ${
              live ? t("streaming", "Streaming") : t("notStreaming", "Not streaming")
            }`
          : t("sourceUnlinked", "Its data source is no longer linked")
      }
      onClick={onClick}
    />
  );
}

/**
 * A parameter's own controls, opened from the tune button.
 *
 * The control is chosen by the declared kind, because that is the only thing
 * that makes a value editable by hand. A parameter fed by a stream keeps its
 * control visible but inert, so the row still shows what the sketch is
 * receiving.
 *
 * The value shown is read from the bus, not from React state: it is what the
 * sketch actually has, and once streams land it moves without re-rendering
 * anything but this row.
 */
function ManualControls({
  paramKey,
  declaration,
  binding,
  bus,
  canEdit,
  updateBinding,
}) {
  const { t } = useTranslation("visuals");

  const value = useSyncExternalStore(
    (listener) => bus.subscribe(paramKey, listener),
    () => bus.get(paramKey),
    () => bus.get(paramKey)
  );

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

// A handful of options fit side by side as a segmented control; past that the
// segments get too narrow to read and a dropdown takes over.
const MAX_SEGMENTS = 4;

/**
 * One control per declared kind:
 *
 * - **number** — a slider when a range resolves, a number field otherwise.
 * - **category** — a toggle for on/off, segments for a few options, a dropdown
 *   for more.
 * - **text** — a text field.
 * - **color** — a swatch.
 * - **vector2 / vector3** — a number field per axis, or a slider per axis when
 *   a range resolves. Unity's inspector is the model: a vector is a row of
 *   numbers that share one range.
 */
export function ValueControl({
  declaration,
  binding,
  value,
  disabled,
  onChange,
  label: given,
}) {
  const { t } = useTranslation("visuals");
  const label = given ?? t("value", "Value");
  const type = declaration?.type || "number";

  // An override set in the detail panel is the range the author means; the
  // declaration's is what the sketch shipped with.
  const min = binding.rangeOverride?.min ?? declaration?.min;
  const max = binding.rangeOverride?.max ?? declaration?.max;
  const ranged = Number.isFinite(Number(min)) && Number.isFinite(Number(max));
  const step = Number.isFinite(Number(declaration?.step))
    ? Number(declaration.step)
    : undefined;

  if (isToggle(declaration)) {
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

  if (type === "category") {
    // Options can be numbers or strings, and both controls take string values,
    // so an option is addressed by its position.
    const options = declaration.options;
    const selected = String(
      options.findIndex((option) => Object.is(option, value))
    );
    const pick = (index) => onChange(options[Number(index)]);

    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        {options.length <= MAX_SEGMENTS ? (
          <ButtonGroup
            fullWidth
            aria-label={label}
            disabled={disabled}
            value={selected}
            items={options.map((option, index) => ({
              value: String(index),
              label: String(option),
            }))}
            onChange={pick}
          />
        ) : (
          <DropdownSelect
            portal
            ariaLabel={label}
            disabled={disabled}
            value={selected}
            options={options.map((option, index) => ({
              value: String(index),
              label: String(option),
            }))}
            onChange={pick}
          />
        )}
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

  if (type === "text") {
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
    const setAxis = (index, next) => {
      const updated = [...current];
      updated[index] = next;
      onChange(updated);
    };

    if (ranged) {
      return (
        <div style={FIELD_STYLE}>
          <span style={FIELD_LABEL_STYLE}>{label}</span>
          {axes.map((axis, index) => (
            <div
              key={axis}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span style={{ ...FIELD_LABEL_STYLE, width: 16 }}>
                {axis.toUpperCase()}
              </span>
              <Slider
                tone="accent"
                min={Number(min)}
                max={Number(max)}
                step={step}
                value={Number(current[index])}
                disabled={disabled}
                ariaLabel={`${label} ${axis.toUpperCase()}`}
                onChange={(next) => setAxis(index, next)}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={FIELD_STYLE}>
        <span style={FIELD_LABEL_STYLE}>{label}</span>
        <div style={{ display: "flex", gap: 12 }}>
          {axes.map((axis, index) => (
            <NumberField
              key={axis}
              step={step}
              placeholder={axis.toUpperCase()}
              aria-label={`${label} ${axis.toUpperCase()}`}
              value={current[index]}
              disabled={disabled}
              onChange={(next) => setAxis(index, next)}
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
          step={step}
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
      <NumberField
        step={step}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
