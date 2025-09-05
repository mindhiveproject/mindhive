import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Icon, Popup } from "semantic-ui-react";
import gql from "graphql-tag";

import { GET_RESOURCE } from "../../Queries/Resource";
import { UPDATE_RESOURCE } from "../../Mutations/Resource";
import { GET_MY_RESOURCES } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";

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
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const modalRef = useRef(null);

  const { data: resourceData } = useQuery(GET_RESOURCE, { variables: { id } });
  const currentCollaborators = resourceData?.resource?.collaborators || [];

  // Initialize selected with current collaborators
  useEffect(() => {
    if (currentCollaborators.length > 0) {
      setSelected(currentCollaborators.map((c) => c.id));
    }
  }, [resourceData]);

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
      setSelected([...selected, userId]);
    }
  };

  const handleRemove = (userId) => {
    setSelected(selected.filter((s) => s !== userId));
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
      console.log("Mutation variables:", mutationVariables);
      await updateResource({ variables: mutationVariables });
      onClose();
    } catch (err) {
      console.error("Error updating collaborators:", err);
      alert(
        "Failed to update collaborators. Please check the console for details."
      );
    }
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
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
        <h2>Share Resource</h2>
        <div className="searchSection">
          <div className="searchInputWrapper">
            <input
              type="text"
              placeholder="Search users (Teachers, Admins, Mentors)..."
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
              <h3>Search Results</h3>
              {users.map((u) => (
                <div key={u.id} className="userItem">
                  <span>{u.username}</span>
                  <Popup
                    content="Add collaborator"
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
            <h3>Collaborators</h3>
            <div className="collaboratorsList">
              {selected.map((s) => {
                const user =
                  usersData?.profiles?.find((u) => u.id === s) ||
                  currentCollaborators.find((c) => c.id === s);
                return (
                  <div key={s} className="collaboratorTag">
                    <span>{user?.username || s}</span>
                    <Popup
                      content="Remove collaborator"
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
            Save Changes
          </button>
          <button className="cancelBtn" onClick={onClose}>
            Cancel
          </button>
        </div>
        {error && <p className="error">Error: {error.message}</p>}
      </div>
    </div>
  );
}
