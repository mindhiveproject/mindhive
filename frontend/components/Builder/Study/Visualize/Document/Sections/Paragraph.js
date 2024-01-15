import JoditEditor from "../../../../../Jodit/Editor";

export default function Paragraph({ content, handleContentChange }) {
  // update content in the local state
  const handleChange = async (content) => {
    handleContentChange({ name: "text", content });
  };

  return (
    <div>
      <JoditEditor content={content?.text || ""} setContent={handleChange} />
    </div>
  );
}
