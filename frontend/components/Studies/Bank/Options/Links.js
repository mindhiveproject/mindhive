import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "../../../Builder/Project/Navigation/ConnectStudy/LinkClass";
import Button from "../../../DesignSystem/Button";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

const SECTION_STYLE = { display: "flex", flexDirection: "column", gap: 8 };
const TITLE_STYLE = { margin: 0 };
const ICON = { width: "20px", height: "20px" };

/* ------------------------------------------------------------------ */
/* Study tabs: the study's linked classes                              */
/* ------------------------------------------------------------------ */

const STUDY_CLASSES = gql`
  query STUDY_CLASSES($id: ID!) {
    study(where: { id: $id }) {
      id
      classes {
        id
        title
      }
    }
  }
`;

const NOTE_STYLE = {
  margin: 0,
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--MH-Theme-Primary-Lighter, #f4f8f7)",
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};
const ACTIONS_STYLE = { display: "flex", gap: 8, justifyContent: "flex-end" };

const sameIds = (a, b) => {
  const x = (a || []).map((c) => c?.id).sort();
  const y = (b || []).map((c) => c?.id).sort();
  return x.length === y.length && x.every((id, i) => id === y[i]);
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
};
const ROW_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};
const ROW_LABEL_STYLE = {
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};
const ROW_VALUE_STYLE = { overflowWrap: "anywhere" };
// Row actions sit next to the value: tighter than the default text button.
export const ROW_BUTTON_STYLE = { padding: "8px 12px" };

// One "Label / value  [Change]" line of the builder's Settings popover.
export function SettingRow({ label, value, actionLabel, onAction, actions }) {
  return (
    <div style={ROW_STYLE}>
      <div style={ROW_TEXT_STYLE}>
        <span className="MH-Type-Label-Small" style={ROW_LABEL_STYLE}>
          {label}
        </span>
        <span className="MH-Type-Body-Base" style={ROW_VALUE_STYLE} title={value}>
          {value}
        </span>
      </div>
      {actions ||
        (actionLabel && (
          <Button variant="text" style={ROW_BUTTON_STYLE} onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

// Read-only by default: the user opts in to edit, and the change is only
// saved when they confirm it.
export function LinkedClass({ study }) {
  const { t } = useTranslation("builder");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const { data } = useQuery(STUDY_CLASSES, {
    variables: { id: study?.id },
    skip: !study?.id,
  });
  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      { query: STUDY_CLASSES, variables: { id: study?.id } },
      { query: MY_STUDY, variables: { id: study?.id } },
      { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
    ],
  });

  const classes = data?.study?.classes || [];

  const startEditing = () => {
    setDraft(classes.map((cl) => ({ id: cl.id })));
    setEditing(true);
  };

  const save = async () => {
    try {
      await updateStudy({
        variables: {
          id: study.id,
          input: {
            classes: { set: draft.map((cl) => ({ id: cl.id })) },
          },
        },
      });
      setEditing(false);
    } catch (err) {
      alert(err?.message);
    }
  };

  return (
    <div style={SECTION_STYLE}>
      <SettingRow
        label={t("studyOptions.class", {}, { default: "Class" })}
        value={
          classes.length
            ? classes.map((cl) => cl.title).join(", ")
            : t("studyOptions.none", {}, { default: "None" })
        }
        actionLabel={
          editing || !study?.id
            ? null
            : t("studyOptions.change", {}, { default: "Change" })
        }
        onAction={startEditing}
      />

      {editing && (
        <>
          <p className="MH-Type-Body-Small" style={NOTE_STYLE}>
            {t("studyOptions.classShort", {}, {
              default: "The class's teachers can follow and review this study.",
            })}
          </p>
          <LinkClass
            study={{ classes: draft }}
            handleChange={({ target: { value } }) => setDraft(value || [])}
            portal
          />
          <div style={ACTIONS_STYLE}>
            <Button
              variant="text"
              disabled={loading}
              onClick={() => setEditing(false)}
            >
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={loading || sameIds(draft, classes)}
              onClick={save}
            >
              {loading
                ? t("header.saving", {}, { default: "Saving" })
                : t("header.save", {}, { default: "Save" })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
