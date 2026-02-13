import React, { useState } from "react";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import AssignCardModal from "./AssignCardModal";

export default function Assigned(props) {
  const {
    studentsCanAssignToCards = false,
    user,
    users,
    assignedTo,
    onAssignedToChange,
    proposal,
    cardId,
    cardData,
  } = props;
  const { t } = useTranslation("builder");
  const [showModal, setShowModal] = useState(false);

  const isTeacherOrMentor = user?.permissions?.some((p) =>
    ["TEACHER", "MENTOR"].includes(p?.name)
  );
  const canAddAssignment = isTeacherOrMentor || studentsCanAssignToCards;

  // Build lookup from users prop (id → username)
  const userLookup = {};
  users?.forEach((u) => {
    userLookup[u.value] = u.text;
  });

  // Get array of assigned user IDs
  const assignedIds = assignedTo?.map((obj) => obj["id"]) || [];

  // Convert users prop to collaborators format for modal
  const collaborators =
    users?.map((u) => ({
      id: u.value,
      username: u.text,
    })) || [];

  const handleOpenModal = () => {
    if (!canAddAssignment) return;
    setShowModal(true);
  };

  const handleSave = (selectedIds) => {
    onAssignedToChange(selectedIds);
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
        {canAddAssignment ? (
          <button
            className="addCollaboratorButton"
            aria-label={t("assigned.addUser", "Add user")}
            onClick={handleOpenModal}
          >
            <img src="/assets/icons/plus.svg" alt="Lock" />
          </button>
        ) : (
          undefined
        )}
      </div>
      {showModal && (
        <AssignCardModal
          collaborators={collaborators}
          assignedTo={assignedTo}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          user={user}
          proposal={proposal}
          cardId={cardId}
          cardData={cardData}
        />
      )}
    </>
  );
}
