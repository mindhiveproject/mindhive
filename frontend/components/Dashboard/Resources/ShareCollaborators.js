import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { Icon, Popup } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_RESOURCE, GET_MY_RESOURCES } from "../../Queries/Resource";
import { UPDATE_RESOURCE } from "../../Mutations/Resource";

export const SEARCH_USERS = gql`
  query SEARCH_USERS($search: String) {
    profiles(
      where: {
        AND: [
          { username: { contains: $search } }
          {
            OR: [
              { permissions: { some: { name: { equals: "TEACHER" } } } }
              { permissions: { some: { name: { equals: "ADMIN" } } } }
              { permissions: { some: { name: { equals: "MENTOR" } } } }
            ]
          }
        ]
      }
    ) {
      id
      username
    }
  }
`;

export default function ShareCollaborators({ id, user, onClose }) {
  const { t } = useTranslation("classes");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const modalRef = useRef(null);

  const { data: resourceData } = useQuery(GET_RESOURCE, { variables: { id } });
  const currentCollaborators = resourceData?.resource?.collaborators || [];

  useEffect(() => {
    if (currentCollaborators.length > 0) {
      setSelected(currentCollaborators.map((c) => c.id));
    }
  }, [resourceData]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: usersData } = useQuery(SEARCH_USERS, { variables: { search } });
  const users =
    usersData?.profiles?.filter(
      (u) => !selected.includes(u.id) && u.id !== user?.id
    ) || [];

  const [updateResource, { loading, error }] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [{ query: GET_MY_RESOURCES, variables: { id: user?.id } }],
  });

  const handleAdd = (userId) => {
    if (!selected.includes(userId)) {
      setSelected((prev) => [...prev, userId]);
    }
  };

  const handleRemove = (userId) => {
    setSelected((prev) => prev.filter((s) => s !== userId));
  };

  const handleSave = async () => {
    try {
      const mutationVariables = {
        id,
        collaborators: {
          connect: selected.map((s) => ({ id: s })),
          disconnect: currentCollaborators
            .filter((c) => !selected.includes(c.id))
            .map((c) => ({ id: c.id })),
        },
      };
      await updateResource({ variables: mutationVariables });
      onClose();
    } catch (err) {
      // Localized alert message
      alert(t("boardManagement.updateCollaboratorsFailed"));
      // Keep console detail for debugging
      // eslint-disable-next-line no-console
      console.error("Error updating collaborators:", err);
    }
  };

  const handleClearSearch = () => setSearch("");

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="shareModalWrapper">
      <div className="shareModal" ref={modalRef}>
        <button className="closeBtn" onClick={onClose}>
          <Icon name="close" />
        </button>

        <h2>{t("boardManagement.shareResourceTitle")}</h2>

        <div className="searchSection">
          <div className="searchInputWrapper">
            <input
              type="text"
              placeholder={t("boardManagement.searchPlaceholderUser")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clearSearchBtn" onClick={handleClearSearch}>
                <Icon name="close" />
              </button>
            )}
          </div>

          {users.length > 0 && (
            <div className="userList">
              <h3>{t("boardManagement.searchResults")}</h3>
              {users.map((u) => (
                <div key={u.id} className="userItem">
                  <span>{u.username}</span>
                  <Popup
                    content={t("boardManagement.addCollaborator")}
                    trigger={
                      <button
                        className="actionBtn add"
                        onClick={() => handleAdd(u.id)}
                      >
                        <Icon name="plus" />
                      </button>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="collaboratorsSection">
            <h3>{t("boardManagement.collaborators")}</h3>
            <div className="collaboratorsList">
              {selected.map((s) => {
                const userObj =
                  usersData?.profiles?.find((u) => u.id === s) ||
                  currentCollaborators.find((c) => c.id === s);
                return (
                  <div key={s} className="collaboratorTag">
                    <span>{userObj?.username || s}</span>
                    <Popup
                      content={t("boardManagement.removeCollaborator")}
                      trigger={
                        <button
                          className="actionBtn remove"
                          onClick={() => handleRemove(s)}
                        >
                          <Icon name="minus" />
                        </button>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="modalActions">
          <button className="saveBtn" onClick={handleSave} disabled={loading}>
            {t("boardManagement.saveChanges")}
          </button>
          <button className="cancelBtn" onClick={onClose}>
            {t("boardManagement.cancel")}
          </button>
        </div>

        {error && (
          <p className="error">
            {t("boardManagement.error")}: {error.message}
          </p>
        )}
      </div>
    </div>
  );
}
