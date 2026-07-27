import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import {
  CREATE_REVIEW_NOTE,
  UPDATE_REVIEW_NOTE,
  DELETE_REVIEW_NOTE,
} from "../../Mutations/OpportunityReviewNote";
import {
  REVIEW_NOTE_KIND,
  filterNotesByRound,
  sortReviewNotesAscending,
} from "../../../lib/reviewThreadRound";

const Shell = styled.section`
  display: grid;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2,
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  }
`;

const RoundSelectWrap = styled.div`
  display: grid;
  gap: 6px;
  max-width: 420px;
`;

const MessageList = styled.div`
  display: grid;
  gap: 12px;
`;

const MessageCard = styled.div`
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 10px;
  background: ${(p) =>
    p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
      ? "var(--MH-Theme-Primary-Light, #def8fb)"
      : "#faf8ff"};
  border: 1px solid
    ${(p) =>
      p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
        ? "rgba(51, 111, 138, 0.28)"
        : "rgba(160, 144, 224, 0.35)"};
  box-shadow: 0 2px 10px rgba(111, 38, 206, 0.06);
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);

  .author {
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .kind {
    font-weight: 500;
  }
`;

const BodyText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font-size: 14px;
  line-height: 1.5;
`;

const Compose = styled.form`
  display: grid;
  gap: 8px;

  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 88px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d3dae0;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: #ffffff;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  font-size: 14px;
  line-height: 1.5;
`;

const ErrorText = styled.p`
  margin: 0;
  color: #871b16;
  font-size: 13px;
`;

function displayName(profile, fallback) {
  if (!profile) return fallback;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    fallback
  );
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function wasEdited(note) {
  if (!note?.createdAt || !note?.updatedAt) return false;
  try {
    return (
      new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() >
      1000
    );
  } catch {
    return false;
  }
}

function MessageItem({
  note,
  viewerId,
  canDeleteAsAdmin,
  t,
  onSave,
  onDelete,
  saving,
  deleting,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body || "");
  const isOwn = !!(viewerId && note?.author?.id === viewerId);
  const canEdit = isOwn;
  const canDelete = isOwn || canDeleteAsAdmin;
  const kind = note.kind || REVIEW_NOTE_KIND.REVIEWER_COMMENT;
  const kindLabel =
    kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
      ? t("reviewThread.kind.sponsorReply", {}, { default: "Sponsor reply" })
      : t("reviewThread.kind.reviewerComment", {}, {
          default: "Reviewer comment",
        });

  const timeLabel = wasEdited(note)
    ? t(
        "reviewThread.updatedAt",
        { date: formatDateTime(note.updatedAt) },
        { default: "Updated {{date}}" }
      )
    : formatDateTime(note.createdAt);

  const handleStartEdit = () => {
    setDraft(note.body || "");
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(note.body || "");
    setEditing(false);
  };

  const handleSave = async () => {
    const body = draft.trim();
    if (!body || body === (note.body || "").trim()) {
      setEditing(false);
      return;
    }
    try {
      await onSave?.(note.id, body);
      setEditing(false);
    } catch {
      // Keep edit mode open so the user can retry.
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t("reviewThread.deleteConfirm", {}, {
        default: "Delete this message?",
      })
    );
    if (!confirmed) return;
    try {
      await onDelete?.(note.id);
    } catch {
      // Error surfaced by parent.
    }
  };

  return (
    <MessageCard $kind={kind}>
      <MetaRow>
        <span className="author">
          {displayName(
            note.author,
            t("reviewThread.unknownAuthor", {}, { default: "Unknown" })
          )}
          <span className="kind"> · {kindLabel}</span>
        </span>
        {timeLabel ? <span>{timeLabel}</span> : null}
      </MetaRow>

      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            disabled={saving}
            aria-label={t("reviewThread.editAria", {}, {
              default: "Edit message",
            })}
          />
          <ActionsRow>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              {t("reviewThread.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
            >
              {saving
                ? t("reviewThread.saving", {}, { default: "Saving…" })
                : t("reviewThread.save", {}, { default: "Save" })}
            </Button>
          </ActionsRow>
        </>
      ) : (
        <>
          <BodyText>{note.body}</BodyText>
          {(canEdit || canDelete) && (
            <ActionsRow>
              {canEdit ? (
                <Button
                  variant="text"
                  onClick={handleStartEdit}
                  style={{
                    padding: 0,
                    minWidth: 0,
                    height: "fit-content",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t("reviewThread.edit", {}, { default: "Edit" })}
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="text"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: 0,
                    minWidth: 0,
                    height: "fit-content",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#c0392b",
                  }}
                >
                  {t("reviewThread.delete", {}, { default: "Delete" })}
                </Button>
              ) : null}
            </ActionsRow>
          )}
        </>
      )}
    </MessageCard>
  );
}

/**
 * Shared chronological review conversation for one (opportunity, round) pair.
 *
 * @param {"teacher"|"sponsor"} mode - Controls compose kind labels/copy.
 * @param {string} messageKind - Keystone kind to post (`reviewer_comment` or `sponsor_reply`).
 * @param {(note: object|null, meta: { kind: string, body: string }) => void} [onPosted]
 *   Called after a successful create (compose). Parent owns follow-up UX.
 */
export default function OpportunityReviewNotesThread({
  opportunityId,
  roundId,
  notes = [],
  rounds = [],
  viewerId,
  canCreate = false,
  canDeleteAsAdmin = false,
  messageKind = REVIEW_NOTE_KIND.REVIEWER_COMMENT,
  mode = "teacher",
  needsRoundSelection = false,
  onSelectRound,
  refetchQueries = [],
  onPosted,
  titleAs = "h2",
  showTitle = true,
  className,
}) {
  const { t } = useTranslation("connect");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);

  const mutationOptions = {
    refetchQueries,
    awaitRefetchQueries: true,
  };

  const [createNote, { loading: creating }] = useMutation(
    CREATE_REVIEW_NOTE,
    mutationOptions
  );
  const [updateNote, { loading: updating }] = useMutation(
    UPDATE_REVIEW_NOTE,
    mutationOptions
  );
  const [deleteNote, { loading: deleting }] = useMutation(
    DELETE_REVIEW_NOTE,
    mutationOptions
  );

  const threadNotes = useMemo(() => {
    if (!roundId) return [];
    return sortReviewNotesAscending(filterNotesByRound(notes, roundId));
  }, [notes, roundId]);

  // When notes are already round-filtered by the query, still sort ascending.
  const displayNotes = useMemo(() => {
    if (!roundId) return [];
    const hasRoundOnNotes = (notes || []).some((n) => n?.round?.id);
    if (!hasRoundOnNotes) {
      return sortReviewNotesAscending(notes);
    }
    return threadNotes;
  }, [notes, roundId, threadNotes]);

  const roundOptions = useMemo(
    () =>
      (rounds || [])
        .filter((r) => r?.id)
        .map((r) => ({
          value: r.id,
          label:
            r.title ||
            t("reviewThread.roundFallback", {}, { default: "Matching round" }),
        })),
    [rounds, t]
  );

  const TitleTag = titleAs === "h3" ? "h3" : "h2";
  const composeEnabled = canCreate && !!roundId && !needsRoundSelection;
  const composePlaceholder =
    mode === "sponsor"
      ? t("reviewThread.compose.sponsorPlaceholder", {}, {
          default: "Write a reply for the reviewers…",
        })
      : t("reviewThread.compose.teacherPlaceholder", {}, {
          default: "Leave a note for the sponsor…",
        });
  const postLabel =
    mode === "sponsor"
      ? t("reviewThread.compose.postReply", {}, { default: "Post reply" })
      : t("reviewThread.compose.post", {}, { default: "Post note" });

  const handlePost = async (event) => {
    event?.preventDefault?.();
    if (!composeEnabled || !opportunityId || !roundId) return;
    const body = draft.trim();
    if (!body) return;
    setError(null);
    try {
      const result = await createNote({
        variables: {
          input: {
            body,
            kind: messageKind,
            opportunity: { connect: { id: opportunityId } },
            round: { connect: { id: roundId } },
          },
        },
      });
      setDraft("");
      onPosted?.(result?.data?.createOpportunityReviewNote || null, {
        kind: messageKind,
        body,
      });
    } catch (e) {
      setError(
        e?.message ||
          t("reviewThread.errors.post", {}, {
            default: "Could not post this message. Please try again.",
          })
      );
    }
  };

  const handleSave = async (noteId, body) => {
    setError(null);
    try {
      await updateNote({
        variables: {
          id: noteId,
          input: { body },
        },
      });
    } catch (e) {
      setError(
        e?.message ||
          t("reviewThread.errors.save", {}, {
            default: "Could not save this message. Please try again.",
          })
      );
      throw e;
    }
  };

  const handleDelete = async (noteId) => {
    setError(null);
    try {
      await deleteNote({ variables: { id: noteId } });
    } catch (e) {
      setError(
        e?.message ||
          t("reviewThread.errors.delete", {}, {
            default: "Could not delete this message. Please try again.",
          })
      );
      throw e;
    }
  };

  return (
    <Shell className={className}>
      {showTitle ? (
        <Header>
          <TitleTag>
            {t("reviewThread.title", {}, { default: "Review conversation" })}
          </TitleTag>
          {mode === "sponsor" ? (
            <p>
              {t("reviewThread.sponsorHelper", {}, {
                default:
                  "Messages shared with reviewers for this matching round.",
              })}
            </p>
          ) : null}
        </Header>
      ) : null}

      {needsRoundSelection || (rounds?.length > 1 && onSelectRound) ? (
        <RoundSelectWrap>
          <label
            htmlFor="review-thread-round"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--MH-Theme-Neutrals-Black, #171717)",
            }}
          >
            {t("reviewThread.roundSelectLabel", {}, {
              default: "Matching round",
            })}
          </label>
          <DropdownSelect
            id="review-thread-round"
            value={roundId || ""}
            onChange={(next) => onSelectRound?.(next || null)}
            options={roundOptions}
            placeholder={t("reviewThread.roundSelectPlaceholder", {}, {
              default: "Select a matching round…",
            })}
            ariaLabel={t("reviewThread.roundSelectLabel", {}, {
              default: "Matching round",
            })}
          />
          {needsRoundSelection ? (
            <EmptyState>
              {t("reviewThread.roundRequired", {}, {
                default:
                  "Select a matching round to view and post messages in this conversation.",
              })}
            </EmptyState>
          ) : null}
        </RoundSelectWrap>
      ) : null}

      {!needsRoundSelection && roundId ? (
        <>
          {displayNotes.length === 0 ? (
            <EmptyState>
              {t("reviewThread.empty", {}, {
                default: "No messages yet. Start the conversation below.",
              })}
            </EmptyState>
          ) : (
            <MessageList>
              {displayNotes.map((note) => (
                <MessageItem
                  key={note.id}
                  note={note}
                  viewerId={viewerId}
                  canDeleteAsAdmin={canDeleteAsAdmin}
                  t={t}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  saving={updating}
                  deleting={deleting}
                />
              ))}
            </MessageList>
          )}

          {composeEnabled ? (
            <Compose onSubmit={handlePost}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={composePlaceholder}
                rows={4}
                disabled={creating}
                aria-label={composePlaceholder}
              />
              <ActionsRow>
                <Button
                  type="submit"
                  variant="filled"
                  disabled={creating || !draft.trim()}
                >
                  {creating
                    ? t("reviewThread.compose.posting", {}, {
                        default: "Posting…",
                      })
                    : postLabel}
                </Button>
              </ActionsRow>
            </Compose>
          ) : null}
        </>
      ) : null}

      {!roundId && !needsRoundSelection ? (
        <EmptyState>
          {t("reviewThread.noRound", {}, {
            default:
              "This opportunity is not linked to a matching round yet, so a conversation cannot be started.",
          })}
        </EmptyState>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}
    </Shell>
  );
}
