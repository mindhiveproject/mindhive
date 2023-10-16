import { StyledForm } from "../../styles/StyledForm";

export default function ProposalForm({ inputs, handleChange }) {
  const setContent = (content) =>
    handleChange({
      target: { name: "content", value: content },
    });

  return (
    <StyledForm>
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
            rows="10"
            name="description"
            value={inputs?.description}
            onChange={handleChange}
          />
        </label>
      </div>
    </StyledForm>
  );
}
