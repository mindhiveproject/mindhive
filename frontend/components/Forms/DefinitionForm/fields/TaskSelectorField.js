import TaskSelector from "../../../Dashboard/Review/ProjectReview/Review/TaskSelector";
import { fieldLabel, fieldHelper } from "../i18n";
import { FieldShell } from "../styles";

function ErrorRow({ error }) {
  if (!error) return null;
  return <span className="error">{error}</span>;
}

export default function TaskSelectorField({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const label = fieldLabel(field, locale);
  const helper = fieldHelper(field, locale);

  const handleItemChange = ({ value: selected }) => {
    onChange(selected);
  };

  return (
    <FieldShell as="div" className="reviewItem">
      {label ? (
        <span className="label-text">
          {label}
          {field.isRequired && <span className="required">*</span>}
        </span>
      ) : null}
      {helper && <span className="hint">{helper}</span>}
      <TaskSelector
        name={field.name}
        handleItemChange={handleItemChange}
        answer={Array.isArray(value) ? value : []}
      />
      <ErrorRow error={error} />
    </FieldShell>
  );
}
