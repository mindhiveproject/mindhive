export default function SelectOne({
  sectionId,
  options,
  selectors,
  onSelectorChange,
  title,
  parameter,
}) {
  return (
    <div className="selectorLine">
      <div className="title">{title}</div>
      <div className="select">
        <select
          id={`${parameter}-${sectionId}`}
          name={parameter}
          onChange={onSelectorChange}
        >
          {options.map((option, num) => (
            <option
              value={option?.value}
              selected={option?.value === selectors[parameter]}
              key={num}
            >
              {option?.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
