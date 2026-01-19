import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Icon, Popup, Modal, Button } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_USERNAMES_WHERE } from "../../../../../Queries/User";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../../Queries/Proposal";

export default function AddCollaboratorModal({
  proposal,
  user,
  onClose,
  refetchQueries = [],
}) {
  const { t } = useTranslation("builder");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const classId = proposal?.usedInClass?.id;
  const currentCollaborators = proposal?.collaborators || [];

  useEffect(() => {
    if (currentCollaborators.length > 0) {
      // Always include all collaborators (including student themselves if they're a collaborator)
      // Students won't see themselves in the UI, but they'll remain in the selected list
      setSelected(currentCollaborators.map((c) => c.id));
    }
  }, [proposal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: Get user's class IDs (from classes where user is student, mentor, or teacher)
  const userClasses = [
    ...(user?.studentIn?.map((cl) => cl?.id) || []),
    ...(user?.mentorIn?.map((cl) => cl?.id) || []),
    ...(user?.teacherIn?.map((cl) => cl?.id) || []),
  ];

  // Step 1: Query users from the user's classes (students first, then mentors, then teachers)
  const { data: usersFromUserClassesData, loading: usersFromUserClassesLoading } = useQuery(
    GET_USERNAMES_WHERE,
    {
      variables: {
        input: {
          OR: [
            { studentIn: { some: { id: { in: userClasses } } } },
            { mentorIn: { some: { id: { in: userClasses } } } },
            { teacherIn: { some: { id: { in: userClasses } } } },
          ],
        },
      },
      skip: userClasses.length === 0,
    }
  );

  // Step 2: Query users from the proposal's class to filter against
  const { data: proposalClassUsersData, loading: proposalClassUsersLoading } = useQuery(
    GET_USERNAMES_WHERE,
    {
      variables: {
        input: {
          OR: [
            { studentIn: { some: { id: { equals: classId } } } },
            { teacherIn: { some: { id: { equals: classId } } } },
            { mentorIn: { some: { id: { equals: classId } } } },
          ],
        },
      },
      skip: !classId,
    }
  );

  // Step 2: Filter users from user's classes to only include those also in proposal's class
  const usersFromUserClasses = usersFromUserClassesData?.profiles || [];
  const proposalClassUserIds = new Set(
    (proposalClassUsersData?.profiles || []).map((u) => u.id)
  );
  
  // Filter to only users who are in both the user's classes AND the proposal's class
  const allUsers = usersFromUserClasses.filter((u) => proposalClassUserIds.has(u.id));

  // Filter users by search term and exclude current user (always) and already selected
  // If user is a student, exclude themselves from the list
  const users =
    allUsers.filter(
      (u) =>
        (!search || u.username.toLowerCase().includes(search.toLowerCase())) &&
        !selected.includes(u.id) &&
        u.id !== user?.id // Always exclude current user from add options
    ) || [];

  const usersLoading = usersFromUserClassesLoading || proposalClassUsersLoading;

  const [updateProposalBoard, { loading, error }] = useMutation(
    UPDATE_PROJECT_BOARD,
    {
      refetchQueries: [
        { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
        ...refetchQueries,
      ],
    }
  );

  const handleAdd = (userId) => {
    if (!selected.includes(userId)) {
      setSelected((prev) => [...prev, userId]);
    }
  };

  const handleRemove = (userId) => {
    setSelected((prev) => prev.filter((s) => s !== userId));
  };

  const handleSave = async () => {
    if (!classId) {
      alert(t("header.noClassAssociated", "This proposal is not associated with a class."));
      return;
    }

    try {
      const initialCollabIds = currentCollaborators.map((c) => c.id);
      
      // If user is a student and they're already a collaborator, preserve them
      // Students can't add/remove themselves, but if they're already added, keep them
      const studentWasCollaborator = isStudent && initialCollabIds.includes(user?.id);
      const finalSelected = studentWasCollaborator
        ? [...selected.filter((id) => id !== user?.id), user.id] // Ensure student remains if they were already a collaborator
        : selected;
      
      // If user is a student, prevent them from adding themselves
      // Teachers and mentors can add themselves
      const connectCollaborators = finalSelected
        .filter((id) => {
          if (!initialCollabIds.includes(id)) {
            // Only allow adding if not a student adding themselves
            return !isStudent || id !== user?.id;
          }
          return false;
        })
        .map((id) => ({ id }));
      
      // If user is a student, prevent them from removing themselves
      // Teachers and mentors can remove themselves
      const disconnectCollaborators = initialCollabIds
        .filter((id) => {
          if (!finalSelected.includes(id)) {
            // Only allow removing if not a student removing themselves
            return !isStudent || id !== user?.id;
          }
          return false;
        })
        .map((id) => ({ id }));

      await updateProposalBoard({
        variables: {
          id: proposal?.id,
          input: {
            collaborators: {
              connect: connectCollaborators,
              disconnect: disconnectCollaborators,
            },
          },
        },
      });
      onClose();
    } catch (err) {
      alert(
        t(
          "header.updateCollaboratorsFailed",
          "Failed to update collaborators. Please try again."
        )
      );
      console.error("Error updating collaborators:", err);
    }
  };

  const handleClearSearch = () => setSearch("");

  // Check if user is a student
  const isStudent = user?.permissions?.some((p) => p?.name === "STUDENT");
  
  // Check if user has classes and proposal has a class
  const userHasClasses = 
    (user?.studentIn?.length > 0) ||
    (user?.mentorIn?.length > 0) ||
    (user?.teacherIn?.length > 0);

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
        {t("header.addCollaborator", "Add Collaborator")}
      </Modal.Header>
      <Modal.Content scrolling style={{ background: "#ffffff", padding: "24px" }}>
        {(!userHasClasses || !classId) ? (
          <div style={{ padding: "20px 0" }}>
            <p>
              {!userHasClasses
                ? t("header.userNoClasses", "You are not associated with any classes.")
                : t("header.noClassAssociated", "This proposal is not associated with a class.")}
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder={t("header.searchPlaceholder", "Search by username...")}
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

              {usersLoading ? (
                <p>{t("header.loading", "Loading...")}</p>
              ) : users.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                    {t("header.searchResults", "Search Results")}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "4px 0" }}>
                    {users.map((u) => (
                      <div
                        key={u.id}
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
                        <span style={{ color: "#274E5B" }}>
                          {u.username}
                        </span>
                        <Popup
                          content={t("header.addCollaborator", "Add Collaborator")}
                          trigger={
                            <button
                              onClick={() => handleAdd(u.id)}
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
                <p>{t("header.noUsersFound", "No users found.")}</p>
              ) : allUsers.length === 0 ? (
                <p>
                  {t(
                    "header.noMatchingClassMembers",
                    "No users from your classes are also in this proposal's class."
                  )}
                </p>
              ) : null}
            </div>

            {selected.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                  {t("header.collaborators", "Collaborators")}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selected
                    .filter((s) => !isStudent || s !== user?.id) // Hide student themselves from the list
                    .map((s) => {
                      const userObj =
                        allUsers.find((u) => u.id === s) ||
                        currentCollaborators.find((c) => c.id === s);
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
                            {userObj?.username || s}
                          </span>
                          <Popup
                            content={t("header.removeCollaborator", "Remove Collaborator")}
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

            {error && (
              <div
                style={{
                  background: "#FDECEA",
                  color: "#B42318",
                  border: "1px solid #F97066",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginTop: "16px",
                  fontSize: "14px",
                }}
              >
                {t("header.error", "Error")}: {error.message}
              </div>
            )}
          </>
        )}
      </Modal.Content>
      <Modal.Actions
        style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
      >
        {userHasClasses && classId && (
          <Button
            onClick={handleSave}
            disabled={loading}
            loading={loading}
            style={styledPrimaryButton}
          >
            {loading
              ? t("header.saving", "Saving...")
              : t("header.save", "Save")}
          </Button>
        )}
        <button onClick={onClose} style={styledSecondaryButton}>
          {t("header.cancel", "Cancel")}
        </button>
      </Modal.Actions>
    </Modal>
  );
}
