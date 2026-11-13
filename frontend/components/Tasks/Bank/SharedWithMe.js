import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import MessageCard from "../../DesignSystem/MessageCard";
import LoadingIcon from "../../DesignSystem/LoadingIcon";
import SharedTaskCard from "./SharedTaskCard";
import {
  TASKS_SHARED_WITH_ME,
  SHARED_COPIES,
  PENDING_TASK_SHARES_COUNT,
} from "../../Queries/TaskShare";
import { RESPOND_TO_TASK_SHARE } from "../../Mutations/TaskShare";

const ORDER = { pending: 0, accepted: 1, declined: 2 };

const EMPTY_BY_TYPE = {
  TASK: {
    key: "sharedWithMe.emptyTask",
    default: "No tasks have been shared with you yet.",
  },
  SURVEY: {
    key: "sharedWithMe.emptySurvey",
    default: "No surveys have been shared with you yet.",
  },
  BLOCK: {
    key: "sharedWithMe.emptyBlock",
    default: "No blocks have been shared with you yet.",
  },
};

function viewerState(invite) {
  if (invite?.acceptedBy?.length) return "accepted";
  if (invite?.declinedBy?.length) return "declined";
  return "pending";
}

/**
 * Develop › Shared with me: what people in your classes shared with you, of
 * one task type. New ones can be added (which makes your own copy) or
 * declined; added ones open your copy; declined ones are behind a filter and
 * can still be added.
 */
export default function SharedWithMe({ user, taskType }) {
  const { t } = useTranslation("builder");
  const [showDeclined, setShowDeclined] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [problem, setProblem] = useState(null);

  const { data, loading, error } = useQuery(TASKS_SHARED_WITH_ME, {
    variables: { me: user?.id },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });
  const invites = data?.taskShareInvites || [];

  const copyIds = useMemo(
    () => invites.map((invite) => invite.viewerCopyId).filter(Boolean),
    [invites]
  );
  const { data: copiesData } = useQuery(SHARED_COPIES, {
    variables: { ids: copyIds },
    skip: !copyIds.length,
    fetchPolicy: "cache-and-network",
  });
  const copiesById = useMemo(
    () =>
      Object.fromEntries(
        (copiesData?.tasks || []).map((task) => [task.id, task])
      ),
    [copiesData]
  );

  const [respond] = useMutation(RESPOND_TO_TASK_SHARE, {
    refetchQueries: [
      { query: TASKS_SHARED_WITH_ME, variables: { me: user?.id } },
      { query: PENDING_TASK_SHARES_COUNT, variables: { me: user?.id, taskType } },
      "MY_TASKS",
    ],
    awaitRefetchQueries: true,
  });

  const items = invites
    .map((invite) => {
      const state = viewerState(invite);
      const copy = copiesById[invite.viewerCopyId] || null;
      return { invite, state, copy };
    })
    // An open share whose task is gone has nothing left to add.
    .filter(({ invite, state }) => state === "accepted" || invite.task)
    .filter(
      ({ invite, copy }) =>
        (copy?.taskType || invite.task?.taskType) === taskType
    );
  const declinedCount = items.filter((i) => i.state === "declined").length;
  const shown = items
    .filter((i) => showDeclined || i.state !== "declined")
    .sort(
      (a, b) =>
        ORDER[a.state] - ORDER[b.state] ||
        new Date(b.invite.createdAt) - new Date(a.invite.createdAt)
    );

  const answer = async (invite, accept) => {
    setBusyId(invite.id);
    setProblem(null);
    try {
      await respond({ variables: { inviteId: invite.id, accept } });
    } catch (err) {
      setProblem(
        err?.graphQLErrors?.[0]?.message ||
          t("sharedWithMe.error", {}, {
            default: "Something went wrong. Please try again.",
          })
      );
    } finally {
      setBusyId(null);
    }
  };

  const empty = EMPTY_BY_TYPE[taskType] || EMPTY_BY_TYPE.TASK;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          margin: "-4px 0 16px",
        }}
      >
        <span
          className="MH-Type-Body-Base"
          style={{ color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)", flex: "1 1 320px" }}
        >
          {t("sharedWithMe.intro", {}, {
            default:
              "Shared by people in your classes. Adding one makes your own copy to edit; the person who shared it can't change it.",
          })}
        </span>
        {declinedCount > 0 && (
          <Chip
            label={t("sharedWithMe.showDeclined", { count: declinedCount }, {
              default: `Show declined (${declinedCount})`,
            })}
            selected={showDeclined}
            onClick={() => setShowDeclined((v) => !v)}
            onClose={showDeclined ? () => setShowDeclined(false) : undefined}
          />
        )}
      </div>

      {problem && (
        <div style={{ marginBottom: 16 }}>
          <MessageCard
            variant="warning"
            message={problem}
            onClose={() => setProblem(null)}
            closeAriaLabel={t("sharedWithMe.dismiss", {}, { default: "Dismiss" })}
          />
        </div>
      )}

      {error ? (
        <MessageCard
          variant="warning"
          message={t("sharedWithMe.loadError", {}, {
            default: "What was shared with you could not be loaded.",
          })}
        />
      ) : loading && !data ? (
        <MessageCard
          variant="neutral"
          message={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <LoadingIcon size={20} />
              {t("developTasks.loading", {}, { default: "Loading…" })}
            </span>
          }
        />
      ) : shown.length === 0 ? (
        <MessageCard
          variant="neutral"
          message={
            declinedCount > 0 && !showDeclined
              ? t("sharedWithMe.onlyDeclined", {}, {
                  default: "Nothing new. You declined everything else.",
                })
              : t(empty.key, {}, { default: empty.default })
          }
        />
      ) : (
        <div className="cardBoard">
          {shown.map(({ invite, state, copy }) => (
            <SharedTaskCard
              key={invite.id}
              invite={invite}
              state={state}
              copy={copy}
              busy={busyId === invite.id}
              onAccept={() => answer(invite, true)}
              onDecline={() => answer(invite, false)}
            />
          ))}
        </div>
      )}
    </>
  );
}
