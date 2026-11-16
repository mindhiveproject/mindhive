import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import Button from "../../DesignSystem/Button";
import {
  getTaskTypeColor,
  getTaskTypeLabelColors,
} from "../../../lib/taskTypeColors";
import { getLocalizedField } from "../../../lib/i18nContent";

const STATUS = {
  pending: { key: "sharedWithMe.statusNew", default: "New", tone: "info" },
  accepted: {
    key: "sharedWithMe.statusAdded",
    default: "Added",
    tone: "success",
  },
  declined: {
    key: "sharedWithMe.statusDeclined",
    default: "Declined",
    tone: "neutral",
  },
};

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person?.username || "";
}

/**
 * A task, survey or block someone shared with you, in Develop › Shared with
 * me. Laid out like the other task cards so new, added and declined ones sit
 * together; only the status chip and the action change.
 *
 * @param {object} invite - The TaskShareInvite.
 * @param {"pending"|"accepted"|"declined"} state - The viewer's answer.
 * @param {object} [copy] - The viewer's copy, once added.
 * @param {() => void} onAccept
 * @param {() => void} onDecline
 * @param {boolean} [busy]
 */
export default function SharedTaskCard({
  invite,
  state,
  copy,
  onAccept,
  onDecline,
  busy = false,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const { locale } = router;

  // The copy once added (it may be renamed); otherwise what was shared.
  const shown = (state === "accepted" && copy) || invite?.task || {};
  const title =
    getLocalizedField(shown, "title", locale) ||
    t("sharedWithMe.untitled", {}, { default: "Untitled" });
  const taskType = shown?.taskType || invite?.task?.taskType;
  const typeColor = getTaskTypeColor(taskType);
  const labelColors = getTaskTypeLabelColors(taskType);
  const typeLabel = taskType
    ? taskType.charAt(0) + taskType.slice(1).toLowerCase()
    : null;
  const status = STATUS[state] || STATUS.pending;
  const copyHref =
    state === "accepted" && copy?.id && taskType
      ? {
          pathname: `/builder/${taskType.toLowerCase()}s/`,
          query: { selector: copy.id },
        }
      : undefined;

  const meta = [
    t("sharedWithMe.sharedBy", { name: personName(invite?.sender) }, {
      default: `Shared by ${personName(invite?.sender)}`,
    }),
    invite?.class?.title,
    invite?.createdAt ? moment(invite.createdAt).format("MMM D, YYYY") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      variant="elevated"
      href={copyHref}
      padding={0}
      ariaLabel={title}
    >
      <div
        style={{
          height: 8,
          width: "100%",
          background: typeColor,
          flexShrink: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          opacity: state === "declined" ? 0.5 : 1,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 16px 16px",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {typeLabel && (
            <Chip
              variant="static"
              label={typeLabel}
              style={{
                background: labelColors.bg,
                backgroundColor: labelColors.bg,
                color: labelColors.fg,
              }}
            />
          )}
          <Chip
            variant="static"
            tone={status.tone}
            label={t(status.key, {}, { default: status.default })}
          />
        </div>

        <span
          className="MH-Type-Title-Base"
          style={{
            color:
              state === "declined"
                ? "var(--MH-Theme-Neutrals-Dark, #6a6a6a)"
                : "#171717",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </span>

        <span
          className="MH-Type-Body-Small"
          style={{ color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" }}
        >
          {meta}
        </span>

        {invite?.message && (
          <span
            className="MH-Type-Body-Base"
            style={{
              color: "#171717",
              fontStyle: "italic",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            “{invite.message}”
          </span>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: "auto",
            paddingTop: 4,
          }}
          data-card-action
        >
          {state === "pending" && (
            <>
              <Button
                variant="filled"
                type="button"
                onClick={onAccept}
                disabled={busy}
              >
                {busy
                  ? t("sharedWithMe.adding", {}, { default: "Adding…" })
                  : t("sharedWithMe.add", {}, { default: "Add my copy" })}
              </Button>
              <Button
                variant="text"
                type="button"
                onClick={onDecline}
                disabled={busy}
              >
                {t("sharedWithMe.decline", {}, { default: "Decline" })}
              </Button>
            </>
          )}
          {state === "declined" && (
            <Button
              variant="outline"
              type="button"
              onClick={onAccept}
              disabled={busy || invite?.status !== "active" || !invite?.task}
            >
              {busy
                ? t("sharedWithMe.adding", {}, { default: "Adding…" })
                : t("sharedWithMe.addAnyway", {}, { default: "Add my copy anyway" })}
            </Button>
          )}
          {state === "accepted" && copyHref && (
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(copyHref)}
            >
              {t("sharedWithMe.open", {}, { default: "Open my copy" })}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
