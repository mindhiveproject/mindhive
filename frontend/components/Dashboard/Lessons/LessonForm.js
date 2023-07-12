import JoditEditor from "../../Jodit/Editor";

export default function LessonForm({ inputs, handleChange, loading }) {
  const setContent = (content) =>
    handleChange({
      target: { name: "content", value: content },
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
      <div>
        <label htmlFor="description">
          Description
          <textarea
            id="description"
            rows="50"
            name="description"
            value={inputs?.description}
            onChange={handleChange}
          />
        </label>
      </div>

      <div>Keywords</div>

      <JoditEditor content={inputs.content} setContent={setContent} />
    </div>
  );
}
