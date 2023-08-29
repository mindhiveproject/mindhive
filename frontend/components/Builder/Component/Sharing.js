import Collaborators from "../../Global/Collaborators";

export default function Sharing({ task, handleChange }) {
  const collaborators = (task && task?.collaborators?.map((c) => c?.id)) || [];

  return (
    <fieldset>
      <div className="block">
        <label>Collaborators on the {task?.taskType?.toLowerCase()}</label>
        <Collaborators
          collaborators={collaborators}
          handleChange={handleChange}
        />
      </div>
    </fieldset>
  );
}
