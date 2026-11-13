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
 * In the Develop area (`showOriginal`), your own tasks are tagged
 * "Original": a study's copies stay in the study, so the bank lists originals.
 *
 * A copy someone shared with you (`sharedByName`, from its
 * settings.sharedFrom) is tagged "Shared by …" instead of "Created by you" and
 * "Original": you own it, but you did not make it.
 *
 * In the Study Builder's own-blocks bank every block is yours, so
 * `hideAuthorTag` leaves "Created by you" out there.
 *
 * @param {object} task - Needs `author { id }`, `collaborators { id }`,
 *   `copiedFrom { id }` and,
 *   for the runtime badge, `runtimeType`.
 * @param {object} [user] - The signed-in user.
 * @param {boolean} [showRuntime=false]
 * @param {boolean} [showOriginal=false]
 * @param {boolean} [hideAuthorTag=false]
 */
export default function BlockTags({
  task,
  user,
  showRuntime = false,
  showOriginal = false,
  hideAuthorTag = false,
}) {
  const { t } = useTranslation("common");
  const relation = blockRelation(task, user?.id);
  const sharedBy = relation === "author" ? task?.sharedByName : null;
  const runtime = showRuntime
    ? RUNTIME_LABELS[task?.runtimeType || "LABJS"]
    : null;
  if (!relation && !runtime) return null;
  const showAuthorTag = relation === "author" && !sharedBy && !hideAuthorTag;

  return (
    <>
      {sharedBy && (
        <Chip
          variant="static"
          tone="info"
          label={t("blockTags.sharedBy", { name: sharedBy }, {
            default: `Shared by ${sharedBy}`,
          })}
        />
      )}
      {showAuthorTag && (
        <Chip
          variant="static"
          tone="neutral"
          label={t("blockTags.createdByYou", {}, { default: "Created by you" })}
        />
      )}
      {showOriginal && relation && !sharedBy && !task?.copiedFrom?.id && (
        <Chip
          variant="static"
          tone="neutral"
          label={t("blockTags.original", {}, { default: "Original" })}
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
