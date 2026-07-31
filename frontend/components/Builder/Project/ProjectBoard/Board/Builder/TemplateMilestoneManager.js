import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  UPDATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../../../../Queries/Milestone";
import { resolveMilestonesFromQuery } from "../../../../../../lib/milestones";

// Read-only listing of the template milestones on this board with a
// deactivate action per row. Creation lives inside the CreateCardModal
// "New checkpoint" flow now, so the inline add-step form is gone.
export default function TemplateMilestoneManager({ templateBoardId }) {
  const { t } = useTranslation("builder");

  const { data, refetch } = useQuery(RESOLVE_MILESTONES_FOR_BOARD, {
    variables: { boardId: templateBoardId },
    skip: !templateBoardId,
  });

  const templateMilestones = (resolveMilestonesFromQuery(data) || []).filter(
    (m) => m.scope === "template"
  );

  const [updateMilestone] = useMutation(UPDATE_TEMPLATE_MILESTONE, {
    onCompleted: () => refetch(),
  });

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

  if (templateMilestones.length === 0) return null;

  return (
    <div className="templateMilestoneManager" style={{ marginBottom: 24 }}>
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

    </div>
  );
}
