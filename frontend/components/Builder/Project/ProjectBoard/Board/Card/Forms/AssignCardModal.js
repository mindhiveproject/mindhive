import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { Icon, Popup, Modal, Button } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { UPDATE_CARD_CONTENT } from "../../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../../Queries/Proposal";

export default function AssignCardModal({
  collaborators,
  assignedTo,
  onSave,
  onClose,
  user,
  proposal,
  cardId,
  cardData,
}) {
  const { t } = useTranslation("builder");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  // Initialize selected with current assignedTo IDs
  useEffect(() => {
    const assignedIds = assignedTo?.map((a) => a.id) || [];
    setSelected(assignedIds);
  }, [assignedTo]);

  // Available users for assignment are exactly the board collaborators
  const allAvailableUsers = collaborators || [];

  // Get currently assigned user IDs
  const assignedIds = assignedTo?.map((a) => a.id) || [];

  // Filter available users by search term and exclude already assigned ones
  const availableCollaborators = allAvailableUsers.filter(
    (c) =>
      (!search || c.username?.toLowerCase().includes(search.toLowerCase())) &&
      !selected.includes(c.id)
  );

  const handleAdd = (userId) => {
    if (!selected.includes(userId)) {
      setSelected((prev) => [...prev, userId]);
    }
  };

  const handleRemove = (userId) => {
    setSelected((prev) => prev.filter((s) => s !== userId));
  };

  const [updateCard, { loading: saving }] = useMutation(UPDATE_CARD_CONTENT, {
    refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }],
  });

  const handleSave = async () => {
    try {
      // Save directly to backend - include all required relationship fields
      // These must be arrays (even if empty) for GraphQL to apply the 'set' operation
      await updateCard({
        variables: {
          id: cardId,
          assignedTo: selected.map((id) => ({ id })),
          // Include existing relationship fields to satisfy mutation requirements
          resources: (cardData?.resources || []).map((resource) => ({
            id: resource?.id,
          })),
          assignments: (cardData?.assignments || []).map((assignment) => ({
            id: assignment?.id,
          })),
          tasks: (cardData?.tasks || []).map((task) => ({ id: task?.id })),
          studies: (cardData?.studies || []).map((study) => ({ id: study?.id })),
        },
      });
      // Update local state
      onSave(selected);
      onClose();
    } catch (error) {
      console.error("Error saving assigned users:", error);
      alert(
        t(
          "assigned.saveError",
          "Failed to save assigned users. Please try again."
        )
      );
    }
  };

  const handleClearSearch = () => setSearch("");

  const styledPrimaryButton = {
    borderRadius: "100px",
    background: "#336F8A",
    fontSize: "16px",
    color: "white",
    border: "1px solid #336F8A",
    padding: "10px 20px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  };

  const styledSecondaryButton = {
    borderRadius: "100px",
    background: "white",
    fontSize: "16px",
    color: "#336F8A",
    border: "1.5px solid #336F8A",
    padding: "10px 20px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="large"
      style={{ borderRadius: "12px", overflow: "hidden" }}
      closeOnDimmerClick
      closeOnEscape
    >
      <Modal.Header
        style={{
          background: "#f9fafb",
          borderBottom: "1px solid #e0e0e0",
          fontFamily: "Nunito",
          fontWeight: 600,
        }}
      >
        {t("assigned.assignCard", "Assign Card")}
      </Modal.Header>
      <Modal.Content scrolling style={{ background: "#ffffff", padding: "24px" }}>
        {allAvailableUsers.length === 0 ? (
          <div style={{ padding: "20px 0" }}>
            <p>
              {t(
                "assigned.noCollaborators",
                "No collaborators available for this board."
              )}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder={t("assigned.searchPlaceholder", "Search by username...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 12px",
                    border: "1px solid #d0d5dd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "inherit",
                  }}
                />
                {search && (
                  <button
                    onClick={handleClearSearch}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#6c757d",
                    }}
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>

              {availableCollaborators.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                    {t("assigned.searchResults", "Search Results")}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "4px 0",
                    }}
                  >
                    {availableCollaborators.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#F3F3F3",
                          border: "1px solid #274E5B",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      >
                        <span style={{ color: "#274E5B" }}>{c.username}</span>
                        <Popup
                          content={t("assigned.addUser", "Add User")}
                          trigger={
                            <button
                              onClick={() => handleAdd(c.id)}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "14px",
                                cursor: "pointer",
                                color: "#274E5B",
                                padding: "2px 4px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Icon name="plus" />
                            </button>
                          }
                          popperModifiers={[
                            {
                              name: "zIndex",
                              enabled: true,
                              phase: "write",
                              fn: ({ state }) => {
                                if (state.elements?.popper) {
                                  state.elements.popper.style.zIndex = "3000";
                                }
                              },
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : search ? (
                <p>{t("assigned.noUsersFound", "No users found.")}</p>
              ) : null}
            </div>

            {selected.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                  {t("assigned.selected", "Selected")}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selected.map((s) => {
                    const collaborator = allAvailableUsers.find((c) => c.id === s);
                    return (
                      <div
                        key={s}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          border: "1px solid #625B71",
                          background: "#FDF2D0",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      >
                        <span style={{ color: "#495057" }}>
                          {collaborator?.username || s}
                        </span>
                        <Popup
                          content={t("assigned.removeUser", "Remove User")}
                          trigger={
                            <button
                              onClick={() => handleRemove(s)}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "14px",
                                cursor: "pointer",
                                color: "#625B71",
                                padding: "2px 4px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Icon name="minus" />
                            </button>
                          }
                          popperModifiers={[
                            {
                              name: "zIndex",
                              enabled: true,
                              phase: "write",
                              fn: ({ state }) => {
                                if (state.elements?.popper) {
                                  state.elements.popper.style.zIndex = "3000";
                                }
                              },
                            },
                          ]}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Content>
      <Modal.Actions
        style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
      >
        {allAvailableUsers.length > 0 && (
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            style={styledPrimaryButton}
          >
            {saving ? t("assigned.saving", "Saving...") : t("assigned.save", "Save")}
          </Button>
        )}
        <button onClick={onClose} style={styledSecondaryButton}>
          {t("assigned.cancel", "Cancel")}
        </button>
      </Modal.Actions>
    </Modal>
  );
}
