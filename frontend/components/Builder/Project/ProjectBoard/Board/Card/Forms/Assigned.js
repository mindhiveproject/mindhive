import React, { useState } from "react";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import AssignCardModal from "./AssignCardModal";

export default function Assigned(props) {
  const { t } = useTranslation("builder");
  const [showModal, setShowModal] = useState(false);

  // Build lookup from users prop (id → username)
  const userLookup = {};
  props.users?.forEach((user) => {
    userLookup[user.value] = user.text;
  });

  // Get array of assigned user IDs
  const assignedIds = props.assignedTo?.map((obj) => obj["id"]) || [];

  // Convert users prop to collaborators format for modal
  const collaborators = props.users?.map((u) => ({
    id: u.value,
    username: u.text,
  })) || [];

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleSave = (selectedIds) => {
    props.onAssignedToChange(selectedIds);
    setShowModal(false);
  };

  return (
    <>
      <div className="collaboratorArray">
        {assignedIds.map((userId) => {
          const username = userLookup[userId] || "";
          return (
            <div key={userId} className="collaboratorChip">
              <span>{username}</span>
            </div>
          );
        })}
        <button
          className="addCollaboratorButton"
          aria-label={t("assigned.addUser", "Add user")}
          onClick={handleOpenModal}
        >
          <Icon name="add" />
        </button>
      </div>
      {showModal && (
        <AssignCardModal
          collaborators={collaborators}
          assignedTo={props.assignedTo}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          user={props.user}
          proposal={props.proposal}
          cardId={props.cardId}
          cardData={props.cardData}
        />
      )}
    </>
  );
}
