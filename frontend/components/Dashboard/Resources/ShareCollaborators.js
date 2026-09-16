import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import IconButton from "../../DesignSystem/IconButton";
import Modal from "../../DesignSystem/Modal";
import { CloseIcon } from "../../DesignSystem/Icons";
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

const SEARCH_STYLE = {
  flex: 1,
  minWidth: 0,
  minHeight: 40,
  padding: "8px 14px",
  boxSizing: "border-box",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1)",
  borderRadius: 8,
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  font: "var(--MH-Type-Body-Base)",
  letterSpacing: 0,
};

const SECTION_TITLE = {
  margin: "0 0 8px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

export default function ShareCollaborators({ id, user, onClose }) {
  const { t } = useTranslation("classes");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const { data: resourceData } = useQuery(GET_RESOURCE, {
    variables: { id },
    skip: !id,
  });
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
      alert(t("boardManagement.updateCollaboratorsFailed"));
      // eslint-disable-next-line no-console
      console.error("Error updating collaborators:", err);
    }
  };

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={t("boardManagement.shareResourceTitle")}
      maxWidth={560}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("boardManagement.cancel")}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleSave}
            disabled={loading}
          >
            {t("boardManagement.saveChanges")}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="search"
            style={SEARCH_STYLE}
            placeholder={t("boardManagement.searchPlaceholderUser")}
            aria-label={t("boardManagement.searchPlaceholderUser")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <IconButton
              variant="subtle"
              icon={<CloseIcon />}
              ariaLabel={t("boardManagement.cancel")}
              onClick={() => setSearch("")}
            />
          ) : null}
        </div>

        {users.length > 0 && (
          <div>
            <h3 className="MH-Type-Title-Base" style={SECTION_TITLE}>
              {t("boardManagement.searchResults")}
            </h3>
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                    borderBottom:
                      "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
                  }}
                >
                  <span
                    className="MH-Type-Body-Base"
                    style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
                  >
                    {u.username}
                  </span>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => handleAdd(u.id)}
                  >
                    {t("boardManagement.addCollaborator")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected.length > 0 && (
          <div>
            <h3 className="MH-Type-Title-Base" style={SECTION_TITLE}>
              {t("boardManagement.collaborators")}
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {selected.map((s) => {
                const userObj =
                  usersData?.profiles?.find((u) => u.id === s) ||
                  currentCollaborators.find((c) => c.id === s);
                const label = userObj?.username || s;
                return (
                  <Chip
                    key={s}
                    label={label}
                    onClose={() => handleRemove(s)}
                    ariaLabel={t("boardManagement.removeCollaborator")}
                  />
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p
            className="MH-Type-Body-Base"
            style={{
              margin: 0,
              color: "var(--MH-Theme-Danger-Dark, #b3261e)",
            }}
          >
            {t("boardManagement.error")}: {error.message}
          </p>
        )}
      </div>
    </Modal>
  );
}
