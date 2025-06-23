import { useCallback, useMemo } from "react";
import { StyledDataComponent } from "../styles/StyledDataJournal";

export default function ComponentEditor({
  component,
  onChange,
  onSave,
  onDelete,
}) {
  console.log("ComponentEditor component prop:", component);

  const content = useMemo(
    () => component?.content || { text: "" },
    [component]
  );

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      console.log("ComponentEditor handleChange:", { field: "text", newValue });
      onChange({
        componentId: component?.id,
        field: "text",
        value: newValue,
      });
    },
    [component, onChange]
  );

  const handleSave = useCallback(() => {
    console.log("ComponentEditor handleSave:", { content });
    onSave();
  }, [content, onSave]);

  console.log("ComponentEditor rendering:", { content });

  return (
    <StyledDataComponent>
      <div>
        <label htmlFor="notes-text">Notes</label>
        <textarea
          id="notes-text"
          value={content.text || ""}
          onChange={handleChange}
          placeholder="Enter your notes here..."
        />
      </div>
      <button onClick={handleSave}>Save</button>
      <button onClick={onDelete}>Delete</button>
    </StyledDataComponent>
  );
}
