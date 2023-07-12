import Avatar from "react-avatar";
import ConnectModal from "./Modal";

export default function Connect({ study, user, handleChange }) {
  const collaborators = study?.collaborators || [];

  return (
    <div className="connectArea">
      <div className="icons">
        {collaborators.map((collaborator, num) => (
          <div key={num}>
            <Avatar
              name={collaborator?.username}
              maxInitials={2}
              size="26px"
              round
            />
          </div>
        ))}
      </div>

      <ConnectModal study={study} user={user} handleChange={handleChange} />
    </div>
  );
}
