import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  UPDATE_TEMPLATE_MILESTONE,
  RESOLVE_MILESTONES_FOR_BOARD,
} from "../../../../../Queries/Milestone";
import { resolveMilestonesFromQuery } from "../../../../../../lib/milestones";
import { getMilestonesForTemplateBoard } from "../../../../../../lib/templateBoardActionCards";

// Listing of review steps on this class template (action-card inventory).
// Deactivate is only for teacher-authored template-scope rows; inherited
// platform defaults are removed by deleting the action card.
export default function TemplateMilestoneManager({
  templateBoardId,
  board,
}) {
  const { t } = useTranslation("builder");

  const { data, refetch } = useQuery(RESOLVE_MILESTONES_FOR_BOARD, {
    variables: { boardId: templateBoardId },
    skip: !templateBoardId,
  });

  const resolved = resolveMilestonesFromQuery(data) || [];
  const listedMilestones = getMilestonesForTemplateBoard(
    board,
    resolved
  );

  const [updateMilestone] = useMutation(UPDATE_TEMPLATE_MILESTONE, {
    onCompleted: () => refetch(),
  });

  const handleDeactivate = async (milestone) => {
    if (milestone?.scope !== "template") return;
    await updateMilestone({
      variables: {
        input: {
          id: milestone.id,
          isActive: false,
        },
      },
    });
  };

  if (listedMilestones.length === 0) return null;

  return (
    <div className="templateMilestoneManager" style={{ marginBottom: 24 }}>
      <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
        {listedMilestones.map((m) => (
          <li key={m.id || m.key} style={{ marginBottom: 8 }}>
            <strong>{m.title || m.key}</strong>
            {m.actionCards?.length ? (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                ({t("templateMilestones.hasActionCard", {}, { default: "action card linked" })})
              </span>
            ) : null}
            {m.scope === "template" ? (
              <button
                type="button"
                onClick={() => handleDeactivate(m)}
                style={{ marginLeft: 12 }}
              >
                {t("templateMilestones.deactivate", {}, { default: "Deactivate" })}
              </button>
            ) : (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                {t("templateMilestones.platformDefault", {}, {
                  default: "MindHive default",
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
