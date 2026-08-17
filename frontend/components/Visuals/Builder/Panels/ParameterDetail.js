"use client";

import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
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
import { bindingFor, labelFor, typeLabel } from "../../Helpers/bindings";
import { removeParameter } from "../../Runtime/parametersFile";

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
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 22,
  lineHeight: "28px",
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
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "24px",
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
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: "24px",
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
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const FIELD_STYLE = { display: "flex", flexDirection: "column", gap: 4 };

// The surface a stream group sits on in the mockups; the empty state borrows it
// so the panel doesn't change shape once data sources land.
const STREAMS_BOX_STYLE = {
  padding: "8px 16px 12px",
  borderRadius: 12,
  background: "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)",
  ...HELP_STYLE,
};

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
 * Name, Data Type and Default Value are shown but not editable: the sketch
 * declares them, and the honest affordance is a jump to where they live.
 * Everything below that line — normalize, range, whether mapping is allowed at
 * all — is data plumbing the dashboard owns.
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
  } = useVisualBuilder();

  const declaration = declared?.[paramKey];
  const binding = bindingFor(bindings, paramKey);
  const parametersFile = files.find((file) => file.role === "parameters");

  const [tab, setTab] = useState(initialTab || "settings");
  const [draft, setDraft] = useState({
    normalize: binding.normalize,
    allowMapping: binding.allowMapping,
    min: binding.rangeOverride?.min ?? "",
    max: binding.rangeOverride?.max ?? "",
  });

  // Re-seed when the panel is pointed at a different parameter without
  // unmounting, so the draft never belongs to the previous one.
  useEffect(() => {
    setDraft({
      normalize: binding.normalize,
      allowMapping: binding.allowMapping,
      min: binding.rangeOverride?.min ?? "",
      max: binding.rangeOverride?.max ?? "",
    });
    setTab(initialTab || "settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // The parameter can vanish underneath this panel — deleted from the file, or
  // renamed in code, which is the same thing as far as the declared key goes.
  useEffect(() => {
    if (!declaration) closePanel();
  }, [declaration, closePanel]);

  if (!declaration) return null;

  function onSave() {
    const min = draft.min === "" ? null : Number(draft.min);
    const max = draft.max === "" ? null : Number(draft.max);
    updateBinding(paramKey, {
      normalize: draft.normalize,
      allowMapping: draft.allowMapping,
      rangeOverride: min === null && max === null ? null : { min, max },
    });
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
                  value={labelFor(paramKey, declaration)}
                  disabled
                  onChange={() => {}}
                />
              </div>
              <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>{t("dataType", "Data Type")}</span>
                <Input
                  aria-label={t("dataType", "Data Type")}
                  value={typeLabel(declaration.type)}
                  disabled
                  onChange={() => {}}
                />
              </div>
              <div style={FIELD_STYLE}>
                <span style={LABEL_STYLE}>
                  {t("defaultValue", "Default Value")}
                </span>
                <Input
                  aria-label={t("defaultValue", "Default Value")}
                  value={
                    declaration.default === undefined
                      ? ""
                      : String(declaration.default)
                  }
                  disabled
                  onChange={() => {}}
                />
              </div>

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
          <div style={STREAMS_BOX_STYLE}>
            {t(
              "noStreamsYet",
              "No data sources are connected to this visual yet. Once data sources land you'll pick an output here; until then, set a value by hand from the parameter's controls."
            )}
          </div>
        </div>
      )}
    </section>
  );
}
