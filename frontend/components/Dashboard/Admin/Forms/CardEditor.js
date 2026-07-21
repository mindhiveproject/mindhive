// Middle pane (when a card is selected). Edits card-level properties:
// title, description, cardType, visibleWhenStatus, roleVisibility.
//
// title/description here are the plain-text English baseline.
// Per-locale variants (titleI18n / descriptionI18n) come in Phase 7.
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation } from "@apollo/client";

import {
  UPDATE_FORM_CARD,
  DELETE_FORM_CARD,
} from "../../../Mutations/FormDefinition";
import { ADMIN_FORM_DEFINITION } from "../../../Queries/FormDefinition";
import {
  EditorPanelShell,
  FieldRow,
  Section,
  PrimaryButton,
  SecondaryButton,
  PillCheckbox,
} from "./EditorPanelStyles";
import I18nField, { cleanI18n } from "./I18nField";

const DangerButton = SecondaryButton;

const CARD_TYPES = [
  { value: "fields", label: "Fields" },
  { value: "members_panel", label: "Members panel (special)" },
  { value: "interest_selector", label: "Interest selector (special)" },
];

const ROLE_OPTIONS = [
  "sponsor",
  "mentor",
  "teacher",
  "student",
  "scientist",
  "admin",
];

const STATUS_OPTIONS = [
  "draft",
  "pending_review",
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
];

function arrToSet(arr) {
  return new Set(Array.isArray(arr) ? arr : []);
}

export default function CardEditor({ card, definitionId, onDeleted }) {
  const [title, setTitle] = useState("");
  const [titleI18n, setTitleI18n] = useState(null);
  const [description, setDescription] = useState("");
  const [descriptionI18n, setDescriptionI18n] = useState(null);
  const [cardType, setCardType] = useState("fields");
  const [roleVisibility, setRoleVisibility] = useState([]);
  const [visibleWhenStatus, setVisibleWhenStatus] = useState([]);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title || "");
    setTitleI18n(card.titleI18n || null);
    setDescription(card.description || "");
    setDescriptionI18n(card.descriptionI18n || null);
    setCardType(card.cardType || "fields");
    setRoleVisibility(
      Array.isArray(card.roleVisibility) ? card.roleVisibility : []
    );
    setVisibleWhenStatus(
      Array.isArray(card.visibleWhenStatus) ? card.visibleWhenStatus : []
    );
    setFlash(null);
  }, [card?.id]);

  const [updateCard, { loading }] = useMutation(UPDATE_FORM_CARD, {
    refetchQueries: [
      { query: ADMIN_FORM_DEFINITION, variables: { id: definitionId } },
    ],
    awaitRefetchQueries: true,
  });
  const [deleteCard, { loading: deleting }] = useMutation(DELETE_FORM_CARD, {
    refetchQueries: [
      { query: ADMIN_FORM_DEFINITION, variables: { id: definitionId } },
    ],
    awaitRefetchQueries: true,
  });

  const handleDelete = async () => {
    const fieldCount = (card.fields || []).length;
    const msg = fieldCount
      ? `Delete card "${card.title || "(untitled)"}" and its ${fieldCount} field(s)?`
      : `Delete card "${card.title || "(untitled)"}"?`;
    if (!window.confirm(msg)) return;
    await deleteCard({ variables: { id: card.id } });
    if (onDeleted) onDeleted();
  };

  const roleSet = useMemo(() => arrToSet(roleVisibility), [roleVisibility]);
  const statusSet = useMemo(
    () => arrToSet(visibleWhenStatus),
    [visibleWhenStatus]
  );

  const toggleRole = (r) => {
    setRoleVisibility((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };
  const toggleStatus = (s) => {
    setVisibleWhenStatus((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    setFlash(null);
    await updateCard({
      variables: {
        id: card.id,
        input: {
          title,
          titleI18n: cleanI18n(titleI18n),
          description,
          descriptionI18n: cleanI18n(descriptionI18n),
          cardType,
          roleVisibility: roleVisibility.length > 0 ? roleVisibility : null,
          visibleWhenStatus:
            visibleWhenStatus.length > 0 ? visibleWhenStatus : null,
        },
      },
    });
    setFlash("Saved.");
  };

  if (!card) return null;

  return (
    <EditorPanelShell>
      <Section>
        <h2>Card · {card.title || "(untitled)"}</h2>
      </Section>

      <FieldRow>
        <span className="label-text">Title (English baseline)</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <I18nField
          bag={titleI18n}
          onChange={setTitleI18n}
          toggleLabel="Add title translations"
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <I18nField
          bag={descriptionI18n}
          onChange={setDescriptionI18n}
          multiline
          toggleLabel="Add description translations"
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Card type</span>
        <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
          {CARD_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="hint">
          "fields" renders the field grid below. The special types mount
          dedicated components (Members panel / Interest selector).
        </span>
      </FieldRow>

      <FieldRow>
        <span className="label-text">Visible to roles</span>
        <span className="hint">Empty = visible to everyone.</span>
        <div className="pills">
          {ROLE_OPTIONS.map((r) => (
            <PillCheckbox
              key={r}
              $checked={roleSet.has(r)}
              onClick={() => toggleRole(r)}
              type="button"
            >
              {r}
            </PillCheckbox>
          ))}
        </div>
      </FieldRow>

      <FieldRow>
        <span className="label-text">Visible when entity status is one of</span>
        <span className="hint">
          For Opportunity cards that should only show when the opportunity
          reaches a certain stage (e.g. "accepted"). Empty = always.
        </span>
        <div className="pills">
          {STATUS_OPTIONS.map((s) => (
            <PillCheckbox
              key={s}
              $checked={statusSet.has(s)}
              onClick={() => toggleStatus(s)}
              type="button"
            >
              {s}
            </PillCheckbox>
          ))}
        </div>
      </FieldRow>

      <Section>
        <PrimaryButton type="button" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save card"}
        </PrimaryButton>
        <DangerButton
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{ color: "#c0392b", borderColor: "#f5c2bf" }}
        >
          {deleting ? "Deleting…" : "Delete card"}
        </DangerButton>
        {flash ? <span className="flash">{flash}</span> : null}
      </Section>
    </EditorPanelShell>
  );
}
