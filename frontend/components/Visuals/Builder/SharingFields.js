"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Card from "../../DesignSystem/Card";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import Input from "../../DesignSystem/Input";
import { MoreVertIcon } from "../../DesignSystem/Icons";

import { SEARCH_PROFILES } from "../../Queries/YQVisual";

/**
 * The two halves of sharing a visual — who may edit it, and who may reach it —
 * as fields rather than as a panel, because the Settings tab and the Share
 * modal show the same controls in two different frames.
 *
 * Each half owns its own column so it drops into either frame as a single
 * child, spaced on the builder's 4px grid the same way the panel body is.
 */
const FIELDS_STYLE = { display: "flex", flexDirection: "column", gap: 12 };

const FIELD_LABEL_STYLE = {
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const HELP_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const COLLABORATOR_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 4px 4px 12px",
};

const RIGHT_ALIGN_STYLE = { display: "flex", justifyContent: "flex-end" };

const PRIVACY_OPTIONS = [
  { value: "private", label: "Only me" },
  { value: "friends", label: "People I follow" },
  { value: "unlisted", label: "Anyone with the link" },
  { value: "public", label: "Everyone" },
];

/** The sharing slice of an edit draft, so both frames start from the same shape. */
export function sharingDraft(visual) {
  return {
    privacy: visual?.privacy || "private",
    collaborators: (visual?.collaborators || []).map((p) => ({
      id: p.id,
      username: p.username,
    })),
    viewers: (visual?.viewers || []).map((p) => ({
      id: p.id,
      username: p.username,
    })),
  };
}

/** The same slice as UPDATE_VISUAL data — the relationship shape is easy to get wrong. */
export function sharingUpdate(draft) {
  return {
    privacy: draft.privacy,
    collaborators: { set: draft.collaborators.map((p) => ({ id: p.id })) },
    viewers: { set: draft.viewers.map((p) => ({ id: p.id })) },
  };
}

/**
 * Who may change the original. By invitation only: there is no "who can edit"
 * audience select, and there shouldn't be.
 */
export function EditingFields({ visual, draft, setDraft, isOwner }) {
  const { t } = useTranslation("visuals");
  const [search, setSearch] = useState("");

  const { data: searchData } = useQuery(SEARCH_PROFILES, {
    variables: { search },
    skip: search.trim().length < 2,
  });

  // Editors and Viewers are two relationships rather than one list with a role
  // column, so the UI merges them back into the single list the design shows.
  const people = [
    ...draft.collaborators.map((p) => ({ ...p, role: "editor" })),
    ...draft.viewers.map((p) => ({ ...p, role: "viewer" })),
  ];

  function setRole(profile, role) {
    setDraft((current) => ({
      ...current,
      collaborators:
        role === "editor"
          ? [...current.collaborators.filter((p) => p.id !== profile.id), profile]
          : current.collaborators.filter((p) => p.id !== profile.id),
      viewers:
        role === "viewer"
          ? [...current.viewers.filter((p) => p.id !== profile.id), profile]
          : current.viewers.filter((p) => p.id !== profile.id),
    }));
  }

  function removePerson(profile) {
    setDraft((current) => ({
      ...current,
      collaborators: current.collaborators.filter((p) => p.id !== profile.id),
      viewers: current.viewers.filter((p) => p.id !== profile.id),
    }));
  }

  return (
    <div style={FIELDS_STYLE}>
      <Input
        label={t("collaborators", "Collaborators")}
        placeholder={t("searchForUser", "Search for a user")}
        value={search}
        disabled={!isOwner}
        onChange={setSearch}
      />
      {searchData?.profiles
        ?.filter((p) => p.id !== visual.author?.id)
        .filter((p) => !people.some((existing) => existing.id === p.id))
        .map((profile) => (
          <Card key={profile.id} variant="subtle">
            <div style={COLLABORATOR_ROW_STYLE}>
              <span style={{ flex: "1 1 auto", ...FIELD_LABEL_STYLE }}>
                {profile.username}
              </span>
              <Button variant="text" onClick={() => setRole(profile, "editor")}>
                {t("addAsEditor", "Add as Editor")}
              </Button>
            </div>
          </Card>
        ))}

      {people.map((profile) => (
        <Card key={profile.id} variant="subtle">
          <div style={COLLABORATOR_ROW_STYLE}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <p style={{ ...FIELD_LABEL_STYLE, margin: 0, font: "var(--MH-Type-Title-Base)" }}>
                {profile.username}
              </p>
              <p style={{ ...HELP_STYLE }}>
                {profile.role === "editor"
                  ? t("editor", "Editor")
                  : t("viewer", "Viewer")}
              </p>
            </div>
            <DropdownMenu
              trigger={<MoreVertIcon />}
              ariaLabel={t("changeRole", "Change role")}
              // The menu portals to the body at a z-index below the Modal
              // overlay's, so inside the Share modal it would open behind the
              // backdrop. Lifted to where DropdownSelect already sits, so both
              // controls here layer the same way in either frame.
              panelStyle={{ zIndex: 100050 }}
              items={[
                {
                  key: "editor",
                  label: t("makeEditor", "Make Editor"),
                  onClick: () => setRole(profile, "editor"),
                },
                {
                  key: "viewer",
                  label: t("makeViewer", "Make Viewer"),
                  onClick: () => setRole(profile, "viewer"),
                },
                {
                  key: "remove",
                  label: t("remove", "Remove"),
                  danger: true,
                  onClick: () => removePerson(profile),
                },
              ]}
            />
          </div>
        </Card>
      ))}

      <div style={RIGHT_ALIGN_STYLE}>
        <Button
          variant="outline"
          onClick={() => copy(`/builder/visuals/${visual.id}`)}
        >
          {t("copyEditingLink", "Copy editing link")}
        </Button>
      </div>
    </div>
  );
}

/** Who can reach the visual at all, once it is out of the builder. */
export function BlockSharingFields({ visual, draft, setDraft, isOwner }) {
  const { t } = useTranslation("visuals");

  return (
    <div style={FIELDS_STYLE}>
      <div>
        <span style={FIELD_LABEL_STYLE}>{t("whoCanView", "Who can view")}</span>
        <div style={{ marginTop: 4 }}>
          <DropdownSelect
            value={draft.privacy}
            disabled={!isOwner}
            ariaLabel={t("whoCanView", "Who can view")}
            options={PRIVACY_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.value, option.label),
            }))}
            onChange={(next) => setDraft((c) => ({ ...c, privacy: next }))}
          />
        </div>
      </div>
      <div style={RIGHT_ALIGN_STYLE}>
        <Button
          variant="outline"
          onClick={() => copy(`/preview/visual/${visual.id}`)}
        >
          {t("copyPublishedLink", "Copy published link")}
        </Button>
      </div>
    </div>
  );
}

function copy(path) {
  navigator.clipboard?.writeText(`${window.location.origin}${path}`);
}
