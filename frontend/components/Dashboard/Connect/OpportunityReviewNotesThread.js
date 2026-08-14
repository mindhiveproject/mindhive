import { useEffect, useId, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import {
  CREATE_REVIEW_NOTE,
  UPDATE_REVIEW_NOTE,
  DELETE_REVIEW_NOTE,
} from "../../Mutations/OpportunityReviewNote";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";
import {
  REVIEW_NOTE_KIND,
  filterNotesByRound,
  getCollapsedReviewNotes,
  getUnreadReviewerCommentNotes,
  getUnreadSponsorReplyNotes,
  sortReviewNotesAscending,
} from "../../../lib/reviewThreadRound";

const Shell = styled.section`
  display: ${(p) => (p.$panel ? "flex" : "grid")};
  flex-direction: ${(p) => (p.$panel ? "column" : undefined)};
  gap: ${(p) => (p.$panel ? "0" : "12px")};
  box-sizing: border-box;
  width: ${(p) => (p.$panel ? "100%" : "80%")};
  margin-inline: ${(p) => (p.$panel ? "0" : "10%")};
  min-height: 0;
  ${(p) =>
    p.$panel
      ? `
    height: 100%;
  `
      : ""}
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;

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
  width: 100%;
  flex-shrink: 0;
`;

const MessageList = styled.div`
  display: grid;
  gap: ${(p) => (p.$panel ? "16px" : "10px")};
  padding: ${(p) => (p.$panel ? "0 0 12px" : "12px")};
  border-radius: ${(p) => (p.$panel ? "0" : "12px")};
  background: ${(p) =>
    p.$panel ? "transparent" : "var(--MH-Theme-Neutrals-White, #ffffff)"};
  border: ${(p) =>
    p.$panel ? "none" : "1px solid var(--MH-Theme-Primary-Medium, #a3d6db)"};
  min-height: 0;
  ${(p) =>
    p.$panel
      ? `
    flex: 1 1 0;
    overflow-y: auto;
    align-self: stretch;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  `
      : ""}
`;

const LoadPreviousWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 2px 0 4px;
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  /* Pack toward main-start: left for row, right for row-reverse.
     Do not pair row-reverse with flex-end — that flips content back left. */
  justify-content: flex-start;
  flex-direction: ${(p) => (p.$alignEnd ? "row-reverse" : "row")};
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: ${(p) => (p.$panel ? "28px" : "32px")};
  height: ${(p) => (p.$panel ? "28px" : "32px")};
  border-radius: 50%;
  overflow: hidden;
  background: ${(p) =>
    p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
      ? "var(--MH-Theme-Primary-Dark, #336f8a)"
      : "var(--MH-Theme-Secondary-Dark, #6f26ce)"};
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: grid;
  place-items: center;
  border: ${(p) => (p.$panel ? "none" : "1.5px solid #ffffff")};
  box-shadow: ${(p) =>
    p.$panel ? "none" : "0 1px 3px rgba(23, 23, 23, 0.12)"};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const BubbleStack = styled.div`
  display: grid;
  gap: 4px;
  /* Leave room for the avatar + gap inside the shelled content width */
  max-width: calc(100% - 40px);
  min-width: 0;
  justify-items: ${(p) => (p.$alignEnd ? "end" : "start")};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  font-family: Inter, sans-serif;
  font-size: 12px;
  line-height: 1.3;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  padding: 0 4px;
  justify-content: ${(p) => (p.$alignEnd ? "flex-end" : "flex-start")};
  text-align: ${(p) => (p.$alignEnd ? "right" : "left")};

  .author {
    font-weight: ${(p) => (p.$panel ? 500 : 600)};
    color: ${(p) =>
      p.$panel
        ? "var(--MH-Theme-Neutrals-Dark, #5f6871)"
        : "var(--MH-Theme-Neutrals-Black, #171717)"};
  }

  .kind {
    font-weight: 500;
  }

  .time {
    opacity: ${(p) => (p.$panel ? 1 : 0.9)};
    font-weight: 400;
  }
`;

const MessageBubble = styled.div`
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: ${(p) =>
    p.$alignEnd ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
  background: ${(p) =>
    p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
      ? "var(--MH-Theme-Primary-Light, #def8fb)"
      : p.$panel
        ? "var(--MH-Theme-Neutrals-White, #ffffff)"
        : "#faf8ff"};
  border: 1px solid
    ${(p) =>
      p.$panel
        ? p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
          ? "var(--MH-Theme-Primary-Medium, #a3d6db)"
          : "var(--MH-Theme-Neutrals-Light, #d3dae0)"
        : p.$kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
          ? "rgba(51, 111, 138, 0.28)"
          : "rgba(160, 144, 224, 0.35)"};
  box-shadow: ${(p) =>
    p.$panel ? "none" : "0 1px 4px rgba(23, 23, 23, 0.05)"};
`;

const BodyText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 1.5;
`;

const Compose = styled.form`
  display: grid;
  gap: 8px;
  flex-shrink: 0;
  padding-top: ${(p) => (p.$panel ? "12px" : "0")};

  label {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: ${(p) => (p.$panel ? "56px" : "72px")};
    max-height: 160px;
    padding: 9px 11px;
    border-radius: ${(p) => (p.$panel ? "8px" : "10px")};
    /* 2px border in both states — focus only changes color (no outer ring to clip). */
    border: 2px solid transparent;
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  textarea:focus,
  textarea:focus-visible {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
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
  background: ${(p) =>
    p.$panel
      ? "var(--MH-Theme-Neutrals-White, #ffffff)"
      : "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)"};
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  ${(p) =>
    p.$panel
      ? `
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);

    &::-webkit-scrollbar {
      display: none;
    }
  `
      : ""}
`;

const ErrorText = styled.p`
  margin: 0;
  color: #871b16;
  font-size: 13px;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const PANEL_ACTION_STYLE = {
  padding: 0,
  minWidth: 0,
  height: "fit-content",
  fontSize: 12,
  fontWeight: 500,
};

function displayName(profile, fallback) {
  if (!profile) return fallback;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    fallback
  );
}

function initialsFromProfile(profile) {
  const first = (profile?.firstName || "").trim();
  const last = (profile?.lastName || "").trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
  }
  const username = (profile?.username || "").trim();
  if (username) return username.slice(0, 2).toUpperCase();
  return "?";
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function formatRelativeTime(value) {
  if (!value) return "";
  try {
    return moment(value).fromNow();
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
  panel = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body || "");
  const isOwn = !!(viewerId && note?.author?.id === viewerId);
  const canEdit = isOwn;
  const canDelete = isOwn || canDeleteAsAdmin;
  const kind = note.kind || REVIEW_NOTE_KIND.REVIEWER_COMMENT;
  // Sponsor replies sit on the right; reviewer comments on the left.
  const alignEnd = kind === REVIEW_NOTE_KIND.SPONSOR_REPLY;
  const kindLabel =
    kind === REVIEW_NOTE_KIND.SPONSOR_REPLY
      ? t("reviewThread.kind.sponsorReply", {}, { default: "Sponsor reply" })
      : t("reviewThread.kind.reviewerComment", {}, {
          default: "Reviewer comment",
        });
  const authorFallback = t("reviewThread.unknownAuthor", {}, {
    default: "Unknown",
  });
  const authorName = displayName(note.author, authorFallback);
  const avatarUrl = getProfileImageUrl(note.author);
  const exactTime = wasEdited(note)
    ? formatDateTime(note.updatedAt)
    : formatDateTime(note.createdAt);
  const relativeTime = wasEdited(note)
    ? formatRelativeTime(note.updatedAt)
    : formatRelativeTime(note.createdAt);
  const timeLabel = panel
    ? wasEdited(note)
      ? t(
          "reviewThread.updatedAt",
          { date: relativeTime },
          { default: "Updated {{date}}" }
        )
      : relativeTime
    : wasEdited(note)
      ? t(
          "reviewThread.updatedAt",
          { date: exactTime },
          { default: "Updated {{date}}" }
        )
      : exactTime;

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
    <MessageRow $alignEnd={alignEnd}>
      <Avatar $kind={kind} $panel={panel} aria-hidden={!avatarUrl}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <span aria-hidden="true">{initialsFromProfile(note.author)}</span>
        )}
      </Avatar>

      <BubbleStack $alignEnd={alignEnd}>
        <MetaRow $alignEnd={alignEnd} $panel={panel}>
          <span className="author">{authorName}</span>
          {panel ? (
            <VisuallyHidden>{kindLabel}</VisuallyHidden>
          ) : (
            <span className="kind">· {kindLabel}</span>
          )}
          {timeLabel ? (
            <span className="time" title={exactTime || undefined}>
              · {timeLabel}
            </span>
          ) : null}
        </MetaRow>

        <MessageBubble
          $kind={kind}
          $alignEnd={alignEnd}
          $panel={panel}
        >
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
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: panel ? 56 : 72,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--MH-Theme-Neutrals-Light, #d3dae0)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              />
              <ActionsRow>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
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
                      style={
                        panel
                          ? {
                              ...PANEL_ACTION_STYLE,
                            color: "var(--MH-Theme-Neutrals-Dark, #5F6871)",
                          }
                          : {
                              padding: 0,
                              minWidth: 0,
                              height: "fit-content",
                              fontSize: 12,
                              fontWeight: 600,
                            }
                      }
                    >
                      {t("reviewThread.edit", {}, { default: "Edit" })}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      variant="text"
                      onClick={handleDelete}
                      disabled={deleting}
                      style={
                        panel
                          ? {
                              ...PANEL_ACTION_STYLE,
                              color: "#c0392b",
                            }
                          : {
                              padding: 0,
                              minWidth: 0,
                              height: "fit-content",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#c0392b",
                            }
                      }
                    >
                      {t("reviewThread.delete", {}, { default: "Delete" })}
                    </Button>
                  ) : null}
                </ActionsRow>
              )}
            </>
          )}
        </MessageBubble>
      </BubbleStack>
    </MessageRow>
  );
}

/**
 * Shared chronological review conversation for one (opportunity, round) pair.
 *
 * @param {"teacher"|"sponsor"} mode - Controls compose kind labels/copy.
 * @param {string} messageKind - Keystone kind to post (`reviewer_comment` or `sponsor_reply`).
 * @param {"default"|"panel"} [layout="default"] - `panel` fills a split-pane column (full width).
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
  layout = "default",
  className,
}) {
  const isPanel = layout === "panel";
  const { t } = useTranslation("connect");
  const composeFieldId = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const [previousExpanded, setPreviousExpanded] = useState(false);

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

  useEffect(() => {
    setPreviousExpanded(false);
  }, [roundId]);

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

  const unreadOtherPartyNotes = useMemo(() => {
    if (!viewerId || !roundId) return [];
    if (mode === "sponsor") {
      return getUnreadReviewerCommentNotes({
        notes: displayNotes,
        roundId,
        viewerId,
      });
    }
    return getUnreadSponsorReplyNotes({
      notes: displayNotes,
      roundId,
      viewerId,
    });
  }, [mode, displayNotes, roundId, viewerId]);

  // Expand when unread other-party notes would be hidden behind "Load previous".
  useEffect(() => {
    if (previousExpanded) return;
    const collapsed = getCollapsedReviewNotes(displayNotes, {
      expanded: false,
    });
    if (!collapsed.canLoadPrevious) return;
    const visibleIds = new Set(
      collapsed.visibleNotes.map((note) => note?.id).filter(Boolean),
    );
    const hasHiddenUnread = unreadOtherPartyNotes.some(
      (note) => note?.id && !visibleIds.has(note.id),
    );
    if (hasHiddenUnread) {
      setPreviousExpanded(true);
    }
  }, [displayNotes, previousExpanded, unreadOtherPartyNotes]);

  const { visibleNotes, canLoadPrevious } = useMemo(
    () =>
      getCollapsedReviewNotes(displayNotes, {
        expanded: previousExpanded,
      }),
    [displayNotes, previousExpanded]
  );

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

  const composeEnabled = canCreate && !!roundId && !needsRoundSelection;
  const composePlaceholder =
    mode === "sponsor"
      ? t("reviewThread.compose.sponsorPlaceholder", {}, {
          default: "Write a reply for the reviewers…",
        })
      : t("reviewThread.compose.teacherPlaceholder", {}, {
          default: "Leave a note for the sponsor…",
        });
  const composeLabel =
    mode === "sponsor"
      ? t("reviewThread.compose.sponsorLabel", {}, {
          default: "Your reply",
        })
      : t("reviewThread.compose.teacherLabel", {}, {
          default: "Your note",
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
    <Shell className={className} $panel={isPanel}>
      {showTitle ? (
        <Header>
          {/* <TitleTag>
            {t("reviewThread.title", {}, { default: "Review conversation" })}
          </TitleTag> */}
          {mode === "sponsor" ? (
            <p>
              {/* {t("reviewThread.sponsorHelper", {}, {
                default:
                  "Messages shared with reviewers for this matching round.",
              })} */}
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
            <EmptyState $panel={isPanel}>
              {t("reviewThread.empty", {}, {
                default: "No messages yet. Start the conversation below.",
              })}
            </EmptyState>
          ) : (
            <MessageList $panel={isPanel}>
              {canLoadPrevious ? (
                <LoadPreviousWrap>
                  <Button
                    type="button"
                    variant={isPanel ? "text" : "outline"}
                    onClick={() => setPreviousExpanded(true)}
                  >
                    {t("reviewThread.loadPreviousMessages", {}, {
                      default: "Load previous messages",
                    })}
                  </Button>
                </LoadPreviousWrap>
              ) : null}
              {visibleNotes.map((note) => (
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
                  panel={isPanel}
                />
              ))}
            </MessageList>
          )}

          {composeEnabled ? (
            <Compose $panel={isPanel} onSubmit={handlePost}>
              {/* {isPanel ? (
                <label htmlFor={composeFieldId}>{composeLabel}</label>
              ) : null} */}
              <textarea
                id={composeFieldId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={composePlaceholder}
                rows={isPanel ? 3 : 4}
                disabled={creating}
                aria-label={isPanel ? undefined : composePlaceholder}
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
