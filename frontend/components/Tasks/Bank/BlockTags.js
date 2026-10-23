import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import { blockRelation } from "../../../lib/blockOwnership";

const RUNTIME_LABELS = {
  LABJS: { key: "blockTags.runtimeLabjs", default: "Lab.js" },
  JSPSYCH: { key: "blockTags.runtimeJspsych", default: "jsPsych" },
  P5: { key: "blockTags.runtimeP5", default: "p5.js" },
};

/**
 * Tags on a block card: whether the signed-in user created the block or
 * collaborates on it, and, where blocks are developed, what runs it. The
 * runtime badge stays off the Study Builder bank and Discover (`showRuntime`).
 *
 * @param {object} task - Needs `author { id }`, `collaborators { id }` and,
 *   for the runtime badge, `runtimeType`.
 * @param {object} [user] - The signed-in user.
 * @param {boolean} [showRuntime=false]
 */
export default function BlockTags({ task, user, showRuntime = false }) {
  const { t } = useTranslation("common");
  const relation = blockRelation(task, user?.id);
  const runtime = showRuntime
    ? RUNTIME_LABELS[task?.runtimeType || "LABJS"]
    : null;
  if (!relation && !runtime) return null;

  return (
    <>
      {relation === "author" && (
        <Chip
          variant="static"
          tone="neutral"
          label={t("blockTags.createdByYou", {}, { default: "Created by you" })}
        />
      )}
      {relation === "collaborator" && (
        <Chip
          variant="static"
          tone="neutral"
          label={t("blockTags.collaborator", {}, { default: "Collaborator" })}
        />
      )}
      {runtime && (
        <Chip
          variant="static"
          tone="neutral"
          label={t(runtime.key, {}, { default: runtime.default })}
        />
      )}
    </>
  );
}
