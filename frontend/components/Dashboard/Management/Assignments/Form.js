import JoditEditor from "../../../Jodit/Editor";

export default function AssignmentForm({ inputs, handleChange }) {
  
  // update content in the local state
  const handleContentChange = (content) => {
    handleChange({ target: { name: "content", value: content } });
  };

  return (
    <div>
      <h2>Edit the assignment</h2>
      <div>
        <label htmlFor="title">
          <p>Title</p>
          <input
            type="text"
            id="title"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            required
          />
        </label>

      </div>

      <JoditEditor content={inputs.content} setContent={handleContentChange} />

     
    </div>
  );
}
