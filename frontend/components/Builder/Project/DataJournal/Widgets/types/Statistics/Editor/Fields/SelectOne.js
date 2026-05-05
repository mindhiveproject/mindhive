import TruncatedTooltipText from "../../../_shared/TruncatedTooltipText";

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
      <TruncatedTooltipText as="div" className="title" text={title} />
      <div className="select">
        <select
          id={`${parameter}-${sectionId}`}
          name={parameter}
          onChange={onSelectorChange}
          value={selectors[parameter] || ''}
        >
          <option value="">{`Select ${title}`}</option>
          {options.map((option, num) => (
            <option
              value={option?.value}
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
