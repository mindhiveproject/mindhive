import TipTapEditor from "../../../TipTap/Main";

export default function AssignmentForm({ inputs, handleChange }) {
  
  // update content in the local state
  const handleContentChange = (content) => {
    handleChange({ target: { name: "content", value: content } });
  };

  // update title in the local state
  const handleTitleChange = (content) => {
    handleChange({ target: { name: "title", value: content } });
  };

  return (
    <div>
      <h2>Edit the assignment</h2>
      <div>
        <label htmlFor="title">
          <p>Title</p>
          <TipTapEditor 
            content={inputs.title || ""} 
            onUpdate={handleTitleChange}
            isEditable={true}
            toolbarVisible={false}
            />
        </label>

      </div>

      <p><br />Content</p>
      <TipTapEditor 
        content={inputs.content || ""} 
        onUpdate={handleContentChange}
        isEditable={true}
        toolbarVisible={true}
      />
    </div>
  );
}
