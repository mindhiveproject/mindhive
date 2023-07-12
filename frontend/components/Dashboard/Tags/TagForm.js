import JoditEditor from "../../Jodit/Editor";

export default function TagForm({ inputs, handleChange, loading }) {
  const setContent = (content) =>
    handleChange({
      target: { name: "description", value: content },
    });

  return (
    <div>
      <h1>{inputs.title}</h1>

      <div>
        <label htmlFor="title">
          Title
          <input
            type="title"
            name="title"
            value={inputs?.title}
            onChange={handleChange}
            required
          />
        </label>
      </div>

      <JoditEditor content={inputs.description} setContent={setContent} />
    </div>
  );
}
