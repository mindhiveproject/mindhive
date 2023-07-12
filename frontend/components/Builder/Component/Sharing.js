import Collaborators from "../../Global/Collaborators";

export default function Sharing({ task, handleChange }) {
  const collaborators = (task && task?.collaborators?.map((c) => c?.id)) || [];

  return (
    <div>
      <Collaborators
        collaborators={collaborators}
        handleChange={handleChange}
      />
    </div>
  );
}
