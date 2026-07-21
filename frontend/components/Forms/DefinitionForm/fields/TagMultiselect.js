// Relationship-backed multiselect for Tag pickers (e.g. Profile.interests,
// Organization.interests). Loads all tags via GET_TAGS and renders a
// Semantic UI Dropdown. The form state is an array of tag IDs; the
// storage layer converts to/from the Keystone relationship shape.
import { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";
import { useQuery } from "@apollo/client";

import { GET_TAGS } from "../../../Queries/Tag";
import { fieldLabel, fieldHelper, fieldPlaceholder } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

export default function TagMultiselect({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const { data, loading } = useQuery(GET_TAGS);

  const options = useMemo(() => {
    const tags = data?.tags || [];
    return tags
      .slice()
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      .map((t) => ({
        key: t.id,
        value: t.id,
        text: t.title || t.slug || t.id,
      }));
  }, [data]);

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}
      <Dropdown
        selection
        multiple
        search
        clearable
        loading={loading}
        placeholder={
          fieldPlaceholder(field, locale) || "Start typing to filter…"
        }
        options={options}
        value={Array.isArray(value) ? value : []}
        onChange={(_, { value: v }) => onChange(v)}
        disabled={disabled}
      />
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
