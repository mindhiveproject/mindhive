import useTranslation from "next-translate/useTranslation";

import { hexForColorInput, normalizeHex } from "./graphColorUtils";

const G = "dataJournal.graph.options.colors";

export default function GraphColorHexRow({
  sectionId,
  rowId,
  label,
  value,
  onChange,
  disabled,
}) {
  const { t } = useTranslation("builder");
  const normalized = normalizeHex(value);
  const colorInputValue = hexForColorInput(normalized);

  return (
    <div className="graphColorHexRow">
      <label className="graphColorHexRowLabel" htmlFor={rowId}>
        {label}
      </label>
      <div className="graphColorHexRowControls">
        <input
          id={rowId}
          type="color"
          aria-label={label}
          value={colorInputValue}
          disabled={disabled}
          onChange={(e) => {
            const next = normalizeHex(e.target.value);
            onChange(next);
          }}
        />
        <button
          type="button"
          className="graphColorHexRowReset"
          disabled={disabled || !normalized}
          onClick={() => onChange(null)}
        >
          {t(`${G}.reset`, {}, { default: "Reset" })}
        </button>
      </div>
    </div>
  );
}
