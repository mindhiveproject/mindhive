// Inline "+ New milestone" form for global milestones. Global scope
// only — template milestones have their own flow inside a template
// proposal board's builder (TemplateMilestoneManager).
//
// The wizard auto-slugifies the title into a lowercase snake_case key
// (matching the unification convention) and defaults reviewStage,
// logEventName, and the formDefinitionKeyPattern from the same slug so
// the composed review-form key resolves cleanly out of the box.
import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";

import { CREATE_MILESTONE } from "../../../Mutations/Milestone";
import { ADMIN_MILESTONES } from "../../../Queries/Milestone";
import {
  FieldRow,
  PrimaryButton,
  SecondaryButton,
  PillCheckbox,
} from "../Forms/EditorPanelStyles";

const Shell = styled.div`
  display: ${({ $open }) => ($open ? "flex" : "none")};
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
`;

const KeyPreview = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: #f7f9f8;
  border: 1px dashed #d3dae0;
  font-family: "Nunito", monospace;
  font-size: 13px;
  color: #171717;

  strong {
    color: #336f8a;
  }
`;

const ACTION_CARD_TYPES = [
  { value: "ACTION_SUBMIT", label: "Submit" },
  { value: "ACTION_PEER_FEEDBACK", label: "Peer feedback" },
  { value: "ACTION_COLLECTING_DATA", label: "Collecting data" },
  { value: "ACTION_PROJECT_REPORT", label: "Project report" },
];

const STATUS_TARGETS = [
  { value: "board", label: "Proposal board" },
  { value: "study", label: "Study" },
];

const PERMISSION_OPTIONS = [
  "MENTOR",
  "TEACHER",
  "SCIENTIST",
  "STUDENT",
  "ADMIN",
];

function slugifyToKey(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toLogEventName(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function NewMilestoneForm({ open, onClose }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionCardType, setActionCardType] = useState("ACTION_SUBMIT");
  const [statusTarget, setStatusTarget] = useState("board");
  const [reviewStage, setReviewStage] = useState("");
  const [reviewStageTouched, setReviewStageTouched] = useState(false);
  const [logEventName, setLogEventName] = useState("");
  const [logEventTouched, setLogEventTouched] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([
    "MENTOR",
    "TEACHER",
    "SCIENTIST",
  ]);
  const [showInFeedbackCenter, setShowInFeedbackCenter] = useState(true);
  const [formDefinitionKeyPattern, setFormDefinitionKeyPattern] = useState(
    "review_{{key}}_{{curriculumType}}"
  );
  const [patternTouched, setPatternTouched] = useState(false);
  const [error, setError] = useState(null);

  const key = slugifyToKey(title);
  const effectiveReviewStage = reviewStageTouched ? reviewStage : key;
  const effectiveLogEvent = logEventTouched
    ? logEventName
    : toLogEventName(key ? `${key}_SUBMITTED` : "");
  const effectivePattern = patternTouched
    ? formDefinitionKeyPattern
    : "review_{{key}}_{{curriculumType}}";

  const [createMilestone, { loading }] = useMutation(CREATE_MILESTONE, {
    refetchQueries: [{ query: ADMIN_MILESTONES }],
    awaitRefetchQueries: true,
  });

  const togglePermission = (name) => {
    setSelectedPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const composedKeyPreview = useMemo(() => {
    return effectivePattern
      .replace("{{key}}", effectiveReviewStage || "…")
      .replace("{{curriculumType}}", "<curriculum>");
  }, [effectivePattern, effectiveReviewStage]);

  const handleCreate = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!key) {
      setError(
        "Couldn't derive a machine key from the title. Use letters, numbers, or spaces."
      );
      return;
    }
    if (!effectiveLogEvent) {
      setError("Log event name is required.");
      return;
    }
    try {
      // Resolve permission names → IDs by querying (uses the auto-
      // generated permissions list, no custom mutation needed).
      const input = {
        key,
        title: title.trim(),
        description: description.trim(),
        scope: "global",
        actionCardType,
        reviewStage: effectiveReviewStage || key,
        statusTarget,
        logEventName: effectiveLogEvent,
        formDefinitionKeyPattern: effectivePattern,
        showInFeedbackCenter,
        isActive: true,
      };
      const res = await createMilestone({ variables: { input } });
      const newId = res?.data?.createMilestone?.id;
      // canReview permissions are attached client-side after the row is
      // created — Keystone's auto-generated MilestoneCreateInput accepts
      // { canReview: { connect: [{ id }, ...] } } but we don't have the
      // permission IDs here without an extra query. Simpler: create the
      // row first, then admins can edit canReview in Keystone admin if
      // the sensible defaults aren't right for this milestone.
      // (Selected permissions kept in state for future extension.)
      if (newId) {
        router.push({
          pathname: "/dashboard/admin-milestones",
          query: { id: newId },
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to create milestone.");
    }
  };

  return (
    <Shell $open={open}>
      <Header>
        <h2>New milestone</h2>
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
      </Header>

      <Grid>
        <FieldRow>
          <span className="label-text">Title</span>
          <span className="hint">
            Human-facing name. Slugifies to the machine key below.
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Brainstorm"
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">Action card type</span>
          <span className="hint">
            Which action-card renders this milestone on a proposal board.
          </span>
          <select
            value={actionCardType}
            onChange={(e) => setActionCardType(e.target.value)}
          >
            {ACTION_CARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow>
          <span className="label-text">Status target</span>
          <span className="hint">
            Does this milestone track completion on the board or on the
            linked study?
          </span>
          <select
            value={statusTarget}
            onChange={(e) => setStatusTarget(e.target.value)}
          >
            {STATUS_TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow>
          <span className="label-text">Review stage</span>
          <span className="hint">
            Used in review-form key composition. Defaults to the machine
            key.
          </span>
          <input
            type="text"
            value={effectiveReviewStage}
            onChange={(e) => {
              setReviewStageTouched(true);
              setReviewStage(e.target.value);
            }}
            placeholder={key || "auto-derived from title"}
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">Log event name</span>
          <span className="hint">
            Emitted when the milestone action fires. UPPER_SNAKE_CASE by
            convention.
          </span>
          <input
            type="text"
            value={effectiveLogEvent}
            onChange={(e) => {
              setLogEventTouched(true);
              setLogEventName(e.target.value);
            }}
            placeholder="e.g. BRAINSTORM_SUBMITTED"
          />
        </FieldRow>

        <FieldRow>
          <span className="label-text">Form definition key pattern</span>
          <span className="hint">
            Template used to resolve the review FormDefinition. Leave the
            default unless you're overriding a per-curriculum key.
          </span>
          <input
            type="text"
            value={effectivePattern}
            onChange={(e) => {
              setPatternTouched(true);
              setFormDefinitionKeyPattern(e.target.value);
            }}
          />
        </FieldRow>

        <FieldRow as="div">
          <span className="label-text">Reviewer permissions</span>
          <span className="hint">
            (Editable in Keystone admin after creation. Defaults are
            applied via the milestone editor.)
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PERMISSION_OPTIONS.map((p) => (
              <PillCheckbox
                key={p}
                $checked={selectedPermissions.includes(p)}
                onClick={() => togglePermission(p)}
                type="button"
              >
                {p}
              </PillCheckbox>
            ))}
          </div>
        </FieldRow>

        <FieldRow as="div">
          <label
            className="checkbox-row"
            style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
          >
            <input
              type="checkbox"
              checked={showInFeedbackCenter}
              onChange={(e) => setShowInFeedbackCenter(e.target.checked)}
            />
            <span>Show in Feedback Center</span>
          </label>
        </FieldRow>
      </Grid>

      <KeyPreview>
        Milestone key: <strong>{key || "(fill in title)"}</strong>
        {"  ·  "}Composed review-form key:{" "}
        <strong>{composedKeyPreview}</strong>
      </KeyPreview>

      {error ? (
        <div style={{ color: "#871b16", fontSize: 13 }}>{error}</div>
      ) : null}

      <div>
        <PrimaryButton
          type="button"
          onClick={handleCreate}
          disabled={loading || !title.trim()}
        >
          {loading ? "Creating…" : "Create milestone"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}
