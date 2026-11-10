import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";

// Values are read by the hypothesis templates' Python, so they stay English.
const DIRECTIONALITY_VALUES = ["higher", "more", "better", "lower", "less", "worse"];

/**
 * One blank of a fill-in-the-blanks hypothesis sentence.
 *
 * Directionality blanks pick from a fixed list; variable blanks suggest the
 * study's aggregate variables and accept anything the student types.
 * The panel is portaled to `document.body` so the widget's scroll and
 * overflow containers can't clip it.
 *
 * `onChange` keeps the `(event, { value })` shape the Axes forms already use.
 */
export default function AggregateVarSelector({
  placeholder,
  allowAdditions,
  optionsAggVar,
  isDirectionality,
  onChange,
  value,
  ariaLabel,
}) {
  const { t } = useTranslation("builder");

  const options = useMemo(() => {
    if (isDirectionality) {
      return DIRECTIONALITY_VALUES.map((v) => ({ value: v, label: v }));
    }
    const seen = new Set();
    return (optionsAggVar || []).reduce((acc, item) => {
      const v = String(item?.value ?? item?.text ?? "").trim();
      if (!v || seen.has(v.toLowerCase())) return acc;
      seen.add(v.toLowerCase());
      acc.push({ value: v, label: item?.text || v });
      return acc;
    }, []);
  }, [isDirectionality, optionsAggVar]);

  const searchable = !isDirectionality;

  return (
    <div className="a-blank">
      <DropdownSelect
        portal
        fitContent
        value={value || ""}
        options={options}
        placeholder={placeholder}
        ariaLabel={ariaLabel || placeholder}
        searchableSingle={searchable}
        allowCustomValue={searchable && !!allowAdditions}
        searchPlaceholder={
          allowAdditions
            ? t("dataJournal.hypVis.axes.common.searchOrTypeVariable", {}, {
                default: "Search or type your own",
              })
            : undefined
        }
        onChange={(next) => onChange?.(null, { value: next })}
      />
    </div>
  );
}
