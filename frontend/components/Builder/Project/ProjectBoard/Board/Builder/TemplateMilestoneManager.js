import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_TEMPLATE_MILESTONE,
  UPDATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../../../../Queries/Milestone";
import { resolveMilestonesFromQuery } from "../../../../../lib/milestones";
import Button from "../../../../DesignSystem/Button";

const PERMISSION_OPTIONS = [
  "MENTOR",
  "TEACHER",
  "SCIENTIST",
  "STUDENT",
];

export default function TemplateMilestoneManager({ templateBoardId }) {
  const { t } = useTranslation("builder");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([
    "MENTOR",
    "TEACHER",
    "SCIENTIST",
  ]);
  const [showForm, setShowForm] = useState(false);

  const { data, refetch } = useQuery(RESOLVE_MILESTONES_FOR_BOARD, {
    variables: { boardId: templateBoardId },
    skip: !templateBoardId,
  });

  const templateMilestones = (resolveMilestonesFromQuery(data) || []).filter(
    (m) => m.scope === "template"
  );

  const [createMilestone, { loading: creating }] = useMutation(
    CREATE_TEMPLATE_MILESTONE,
    {
      onCompleted: () => {
        setTitle("");
        setDescription("");
        setShowForm(false);
        refetch();
      },
    }
  );

  const [updateMilestone] = useMutation(UPDATE_TEMPLATE_MILESTONE, {
    onCompleted: () => refetch(),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createMilestone({
      variables: {
        input: {
          templateBoardId,
          title: title.trim(),
          description: description.trim(),
          showInFeedbackCenter: true,
          statusTarget: "board",
          canReviewPermissionNames: selectedPermissions,
        },
      },
    });
  };

  const togglePermission = (name) => {
    setSelectedPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleDeactivate = async (milestone) => {
    await updateMilestone({
      variables: {
        input: {
          id: milestone.id,
          isActive: false,
        },
      },
    });
  };

  return (
    <div className="templateMilestoneManager" style={{ marginBottom: 24 }}>
      <div className="h24">
        {t("templateMilestones.title", {}, { default: "Review steps" })}
      </div>
      <p style={{ marginBottom: 12 }}>
        {t(
          "templateMilestones.description",
          {},
          {
            default:
              "Add custom review steps to this class template. Each step creates an action card students use to submit work for feedback.",
          }
        )}
      </p>

      {templateMilestones.length > 0 && (
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          {templateMilestones.map((m) => (
            <li key={m.id} style={{ marginBottom: 8 }}>
              <strong>{m.title || m.key}</strong>
              {m.actionCards?.length ? (
                <span style={{ marginLeft: 8, opacity: 0.7 }}>
                  ({t("templateMilestones.hasActionCard", {}, { default: "action card linked" })})
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => handleDeactivate(m)}
                style={{ marginLeft: 12 }}
              >
                {t("templateMilestones.deactivate", {}, { default: "Deactivate" })}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <Button type="button" onClick={() => setShowForm(true)}>
          {t("templateMilestones.addStep", {}, { default: "Add review step" })}
        </Button>
      ) : (
        <form onSubmit={handleCreate}>
          <label>
            {t("templateMilestones.stepTitle", {}, { default: "Step title" })}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginBottom: 8 }}
            />
          </label>
          <label>
            {t("templateMilestones.stepDescription", {}, { default: "Description" })}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: 8 }}
            />
          </label>
          <div style={{ marginBottom: 8 }}>
            <span>
              {t("templateMilestones.canReview", {}, { default: "Who can review" })}
            </span>
            {PERMISSION_OPTIONS.map((name) => (
              <label key={name} style={{ marginLeft: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(name)}
                  onChange={() => togglePermission(name)}
                />
                {name}
              </label>
            ))}
          </div>
          <Button type="submit" disabled={creating}>
            {t("templateMilestones.create", {}, { default: "Create step" })}
          </Button>
          <Button type="button" onClick={() => setShowForm(false)}>
            {t("templateMilestones.cancel", {}, { default: "Cancel" })}
          </Button>
        </form>
      )}
    </div>
  );
}
