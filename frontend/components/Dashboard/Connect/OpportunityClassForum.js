import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import moment from "moment";
import { isOpportunityStakeholder } from "../../../lib/opportunityPeople";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import {
  AddIcon,
  CheckIcon,
  PinIcon,
  SearchIcon,
  UnpinIcon,
} from "../../DesignSystem/Icons";
import {
  GET_OPPORTUNITY_CLASS_FORUM,
} from "../../Queries/Chat";
import {
  CREATE_NEW_MESSAGE,
  CREATE_OPPORTUNITY_CLASS_FORUM,
  DELETE_MESSAGE,
  UPDATE_CHAT_SETTINGS,
  UPDATE_MESSAGE,
} from "../../Mutations/Chat";

const FAQ_KIND = "opportunityClassFaq";
const FAQ_SETTINGS = { kind: FAQ_KIND };
const ROLE_QUESTION = "question";
const ROLE_ANSWER = "officialAnswer";
const STATUS_OPEN = "open";
const STATUS_ANSWERED = "answered";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  min-width: 0;
`;

const QuestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  max-height: 520px;
  overflow-y: auto;
  padding: 2px;
`;

const QuestionCard = styled.article`
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  box-sizing: border-box;
`;

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);

  .name {
    font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const PlusOneButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 32px;
  margin: 0;
  padding: 0 8px 0 4px;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #d3dae0);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  cursor: pointer;
  box-sizing: border-box;

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }

  &[aria-pressed="true"] {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:hover:not(:disabled) {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  &[aria-pressed="true"]:hover:not(:disabled) {
    background: var(--MH-Theme-Primary-Medium, #a3d6db);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const BodyText = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
`;

const AnswerBlock = styled.div`
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  border: 1px solid var(--MH-Theme-Primary-Medium, #a3d6db);
`;

const AnswerHeading = styled.p`
  margin: 0;
  font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--MH-Theme-Primary-Dark, #336f8a);
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
`;

const StatusText = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

const ErrorText = styled.p`
  margin: 0;
  color: #871b16;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
`;

const Compose = styled.form`
  display: grid;
  gap: 8px;
  flex-shrink: 0;

  label {
    margin: 0;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    min-height: 72px;
    max-height: 160px;
    padding: 9px 11px;
    border-radius: 12px;
    border: 2px solid transparent;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  textarea:focus,
  textarea:focus-visible {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const SearchField = styled.div`
  display: grid;
  gap: 8px;
  flex-shrink: 0;

  label {
    margin: 0;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .inputWrap {
    position: relative;
  }

  .inputWrap svg {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: var(--MH-Theme-Neutrals-Dark, #5f6871);
    pointer-events: none;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 11px 9px 38px;
    border-radius: 12px;
    border: 2px solid transparent;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  input:focus,
  input:focus-visible {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
`;

function asSettings(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof value === "object") return value;
  return {};
}

function displayName(profile, fallback) {
  if (!profile) return fallback;
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    fallback
  );
}

function isQuestionWord(word) {
  if (!word) return false;
  const role = asSettings(word.settings).role;
  if (role === ROLE_ANSWER) return false;
  if (role === ROLE_QUESTION) return true;
  return Boolean(word.isMain);
}

function officialAnswerFrom(word) {
  const children = Array.isArray(word?.children) ? word.children : [];
  const official = children.filter(
    (child) => asSettings(child.settings).role === ROLE_ANSWER,
  );
  official.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });
  return official[0] || null;
}

function upvoteIds(settings) {
  const raw = asSettings(settings).upvotedBy;
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id)).filter(Boolean);
}

function isPinnedSettings(settings) {
  return Boolean(asSettings(settings).pinned);
}

function pinnedAtTime(item) {
  if (item?.pinnedAt) {
    const time = new Date(item.pinnedAt).getTime();
    if (!Number.isNaN(time)) return time;
  }
  return item?.createdAt ? new Date(item.createdAt).getTime() : 0;
}

function createdAtTime(item) {
  return item?.createdAt ? new Date(item.createdAt).getTime() : 0;
}

function questionSettings(word, patch = {}) {
  const current = asSettings(word?.settings);
  const status =
    current.status === STATUS_ANSWERED ? STATUS_ANSWERED : STATUS_OPEN;
  return {
    ...current,
    role: ROLE_QUESTION,
    status,
    upvotedBy: upvoteIds(current),
    ...patch,
  };
}

function compareUnpinned(a, b) {
  const aAnswered = a.isAnswered ? 1 : 0;
  const bAnswered = b.isAnswered ? 1 : 0;
  if (aAnswered !== bAnswered) return aAnswered - bAnswered;
  const voteDiff = b.upvoteCount - a.upvoteCount;
  if (voteDiff !== 0) return voteDiff;
  return createdAtTime(b) - createdAtTime(a);
}

function compareQuestions(a, b) {
  const aPinned = a.isPinned ? 1 : 0;
  const bPinned = b.isPinned ? 1 : 0;
  if (aPinned !== bPinned) return bPinned - aPinned;
  if (a.isPinned && b.isPinned) {
    const pinDiff = pinnedAtTime(b) - pinnedAtTime(a);
    if (pinDiff !== 0) return pinDiff;
    return compareUnpinned(a, b);
  }
  return compareUnpinned(a, b);
}

function isClassTeacher(cls, viewerId) {
  if (!cls || !viewerId) return false;
  if (cls.creator?.id === viewerId) return true;
  return (cls.mentors || []).some((mentor) => mentor?.id === viewerId);
}

/**
 * Class-local FAQ for one opportunity × class Talk room.
 * Get-or-creates the Talk on mount; questions are isMain Words, one official
 * answer child, support votes on settings.upvotedBy, pin on settings.pinned.
 */
export default function OpportunityClassForum({
  opportunityId,
  classId,
  user,
}) {
  const { t } = useTranslation("classes");
  const askFieldId = useId();
  const searchFieldId = useId();
  const creatingRoomRef = useRef(false);
  const migratedKindRef = useRef(null);
  const busyRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [askDraft, setAskDraft] = useState("");
  const [askError, setAskError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [busyKey, setBusyKey] = useState(null);

  const skip = !opportunityId || !classId;
  const viewerId = user?.id || null;

  const { data, loading, error, refetch } = useQuery(
    GET_OPPORTUNITY_CLASS_FORUM,
    {
      variables: { opportunityId, classId },
      skip,
      fetchPolicy: "cache-and-network",
    },
  );

  const [createForum, { loading: creatingForum }] = useMutation(
    CREATE_OPPORTUNITY_CLASS_FORUM,
  );
  const [createMessage, { loading: posting }] = useMutation(CREATE_NEW_MESSAGE);
  const [updateMessage] = useMutation(UPDATE_MESSAGE);
  const [deleteMessage] = useMutation(DELETE_MESSAGE);
  const [updateChatSettings] = useMutation(UPDATE_CHAT_SETTINGS);

  const talk = data?.talks?.[0] || null;
  const words = talk?.words || [];

  const { canAnswer, canPlusOne } = useMemo(() => {
    if (!viewerId || !talk) {
      return { canAnswer: false, canPlusOne: false };
    }
    const cls =
      (talk.classes || []).find((item) => item?.id === classId) ||
      talk.classes?.[0] ||
      null;
    const isTeacher = isClassTeacher(cls, viewerId);
    const isSponsor = (talk.opportunities || []).some((opp) =>
      isOpportunityStakeholder(opp, viewerId),
    );
    const canModerate = Boolean(isTeacher || isSponsor);
    return {
      canAnswer: canModerate,
      canPlusOne: Boolean(viewerId && !isTeacher && !isSponsor),
    };
  }, [talk, classId, viewerId]);

  const someoneLabel = t(
    "opportunities.classForum.someone",
    {},
    { default: "Someone" },
  );

  const questions = useMemo(() => {
    return words
      .filter(isQuestionWord)
      .map((word) => {
        const settings = asSettings(word.settings);
        const answer = officialAnswerFrom(word);
        const upvotedBy = upvoteIds(settings);
        const isAnswered =
          Boolean(answer) || settings.status === STATUS_ANSWERED;
        return {
          word,
          answer,
          isAnswered,
          isPinned: isPinnedSettings(settings),
          pinnedAt: settings.pinnedAt || null,
          upvotedBy,
          upvoteCount: upvotedBy.length,
          voted: viewerId ? upvotedBy.includes(String(viewerId)) : false,
          createdAt: word.createdAt,
        };
      })
      .sort(compareQuestions);
  }, [words, viewerId]);

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return questions;
    return questions.filter((item) =>
      String(item.word?.message || "").toLowerCase().includes(query),
    );
  }, [questions, searchQuery]);

  // Get-or-create: if query returned no room, create one (race → keep oldest via refetch).
  useEffect(() => {
    if (skip || loading || talk || creatingRoomRef.current) return;
    if (error) return;

    let cancelled = false;
    creatingRoomRef.current = true;
    setCreateError(null);

    (async () => {
      try {
        await createForum({
          variables: {
            opportunityId,
            classId,
            settings: FAQ_SETTINGS,
          },
        });
        if (!cancelled) {
          await refetch();
        }
      } catch (e) {
        if (!cancelled) {
          setCreateError(e);
          try {
            await refetch();
          } catch (_) {
            /* ignore */
          }
        }
      } finally {
        creatingRoomRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    skip,
    loading,
    talk,
    error,
    opportunityId,
    classId,
    createForum,
    refetch,
  ]);

  // Optional: rewrite leftover live-forum kind on first open.
  useEffect(() => {
    if (!talk?.id) return;
    const kind = asSettings(talk.settings).kind;
    if (kind === FAQ_KIND) return;
    if (migratedKindRef.current === talk.id) return;
    migratedKindRef.current = talk.id;

    updateChatSettings({
      variables: {
        id: talk.id,
        settings: { ...asSettings(talk.settings), kind: FAQ_KIND },
      },
    }).catch(() => {
      /* non-blocking */
    });
  }, [talk, updateChatSettings]);

  const handleAsk = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const message = askDraft.trim();
      if (!message || !talk?.id || posting) return;
      setAskError(null);
      try {
        await createMessage({
          variables: {
            input: {
              talk: { connect: { id: talk.id } },
              message,
              isMain: true,
              settings: {
                role: ROLE_QUESTION,
                status: STATUS_OPEN,
                upvotedBy: [],
              },
            },
          },
        });
        setAskDraft("");
        await refetch();
      } catch (err) {
        setAskError(err);
      }
    },
    [askDraft, talk?.id, posting, createMessage, refetch],
  );

  const handleTogglePlusOne = useCallback(
    async (item) => {
      if (!canPlusOne || !viewerId || !item?.word?.id || busyRef.current) {
        return;
      }
      const key = `plus:${item.word.id}`;
      busyRef.current = true;
      setBusyKey(key);
      setActionError(null);
      const nextIds = item.voted
        ? item.upvotedBy.filter((id) => id !== String(viewerId))
        : [...item.upvotedBy, String(viewerId)];
      try {
        await updateMessage({
          variables: {
            id: item.word.id,
            message: item.word.message,
            settings: questionSettings(item.word, { upvotedBy: nextIds }),
          },
        });
        await refetch();
      } catch (err) {
        setActionError("plusOne");
      } finally {
        busyRef.current = false;
        setBusyKey(null);
      }
    },
    [canPlusOne, viewerId, updateMessage, refetch],
  );

  const handleTogglePin = useCallback(
    async (item) => {
      if (!canAnswer || !item?.word?.id || busyRef.current) return;
      const key = `pin:${item.word.id}`;
      busyRef.current = true;
      setBusyKey(key);
      setActionError(null);
      const nextPinned = !item.isPinned;
      try {
        await updateMessage({
          variables: {
            id: item.word.id,
            message: item.word.message,
            settings: questionSettings(item.word, {
              pinned: nextPinned,
              pinnedAt: nextPinned ? new Date().toISOString() : null,
            }),
          },
        });
        await refetch();
      } catch (err) {
        setActionError("pin");
      } finally {
        busyRef.current = false;
        setBusyKey(null);
      }
    },
    [canAnswer, updateMessage, refetch],
  );

  const handleDeleteQuestion = useCallback(
    async (item) => {
      if (!viewerId || !item?.word?.id || busyRef.current) return;
      if (item.word.author?.id !== viewerId) return;
      const confirmed = window.confirm(
        t(
          "opportunities.classForum.deleteConfirm",
          {},
          { default: "Delete this question?" },
        ),
      );
      if (!confirmed) return;
      const key = `delete:${item.word.id}`;
      busyRef.current = true;
      setBusyKey(key);
      setActionError(null);
      try {
        const children = Array.isArray(item.word.children)
          ? item.word.children
          : [];
        for (const child of children) {
          if (!child?.id) continue;
          await deleteMessage({ variables: { id: child.id } });
        }
        await deleteMessage({ variables: { id: item.word.id } });
        if (answeringId === item.word.id) {
          setAnsweringId(null);
          setAnswerDraft("");
        }
        await refetch();
      } catch (err) {
        setActionError("delete");
      } finally {
        busyRef.current = false;
        setBusyKey(null);
      }
    },
    [viewerId, answeringId, deleteMessage, refetch, t],
  );

  const openAnswerForm = useCallback((item) => {
    if (busyRef.current) return;
    setActionError(null);
    setAnsweringId(item.word.id);
    setAnswerDraft(item.answer?.message || "");
  }, []);

  const cancelAnswerForm = useCallback(() => {
    setAnsweringId(null);
    setAnswerDraft("");
  }, []);

  const handleSaveAnswer = useCallback(
    async (item) => {
      const message = answerDraft.trim();
      if (!message || !talk?.id || !item?.word?.id || busyRef.current) return;
      const key = `answer:${item.word.id}`;
      busyRef.current = true;
      setBusyKey(key);
      setActionError(null);
      try {
        if (item.answer?.id) {
          await updateMessage({
            variables: {
              id: item.answer.id,
              message,
              settings: {
                ...asSettings(item.answer.settings),
                role: ROLE_ANSWER,
              },
            },
          });
        } else {
          await createMessage({
            variables: {
              input: {
                talk: { connect: { id: talk.id } },
                parent: { connect: { id: item.word.id } },
                message,
                isMain: false,
                settings: { role: ROLE_ANSWER },
              },
            },
          });
        }
        await updateMessage({
          variables: {
            id: item.word.id,
            message: item.word.message,
            settings: questionSettings(item.word, {
              status: STATUS_ANSWERED,
            }),
          },
        });
        setAnsweringId(null);
        setAnswerDraft("");
        await refetch();
      } catch (err) {
        setActionError("answer");
      } finally {
        busyRef.current = false;
        setBusyKey(null);
      }
    },
    [answerDraft, talk?.id, createMessage, updateMessage, refetch],
  );

  const emptyHint = t("opportunities.classForum.empty", {}, {
    default: "No questions yet. Ask a question about this opportunity.",
  });
  const searchEmptyHint = t("opportunities.classForum.searchEmpty", {}, {
    default: "No questions match your search.",
  });

  if (skip) {
    return (
      <StatusText>
        {t("opportunities.classForum.missingContext", {}, {
          default: "Class FAQ needs a class and opportunity.",
        })}
      </StatusText>
    );
  }

  if (loading && !talk) {
    return (
      <StatusText>
        {t("opportunities.classForum.loading", {}, {
          default: "Loading class FAQ…",
        })}
      </StatusText>
    );
  }

  if (error && !talk) {
    return (
      <ErrorText>
        {t("opportunities.classForum.loadFailed", {}, {
          default: "Could not load the class FAQ. Please try again.",
        })}
      </ErrorText>
    );
  }

  if (!talk && creatingForum) {
    return (
      <StatusText>
        {t("opportunities.classForum.starting", {}, {
          default: "Starting class FAQ…",
        })}
      </StatusText>
    );
  }

  if (!talk && createError) {
    return (
      <ErrorText>
        {t("opportunities.classForum.createFailed", {}, {
          default: "Could not start the class FAQ. Please try again.",
        })}
      </ErrorText>
    );
  }

  if (!talk) {
    return (
      <StatusText>
        {t("opportunities.classForum.loading", {}, {
          default: "Loading class FAQ…",
        })}
      </StatusText>
    );
  }

  return (
    <Shell>
      <SearchField>
        <div className="inputWrap">
          <SearchIcon />
          <input
            id={searchFieldId}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("opportunities.classForum.searchPlaceholder", {}, {
              default: "Search questions",
            })}
            autoComplete="off"
          />
        </div>
      </SearchField>

      {questions.length === 0 ? (
        <EmptyState>{emptyHint}</EmptyState>
      ) : filteredQuestions.length === 0 ? (
        <EmptyState>{searchEmptyHint}</EmptyState>
      ) : (
        <QuestionList>
          {filteredQuestions.map((item) => {
            const {
              word,
              answer,
              isAnswered,
              isPinned,
              upvoteCount,
              voted,
            } = item;
            const name = displayName(word.author, someoneLabel);
            const time = word.createdAt
              ? moment(word.createdAt).format("MMM D, YYYY")
              : "";
            const isAnswering = answeringId === word.id;
            const plusBusy = busyKey === `plus:${word.id}`;
            const pinBusy = busyKey === `pin:${word.id}`;
            const deleteBusy = busyKey === `delete:${word.id}`;
            const answerBusy = busyKey === `answer:${word.id}`;
            const answerFieldId = `faq-answer-${word.id}`;
            const canDeleteOwn = Boolean(
              viewerId && word.author?.id === viewerId,
            );
            const showFooterActions =
              canAnswer || canDeleteOwn;

            return (
              <QuestionCard key={word.id}>
                <CardHeader>
                  <CardMeta>
                    <span className="name">{name}</span>
                    {time ? <span className="time">{time}</span> : null}
                  </CardMeta>
                  <HeaderActions>
                    {isAnswered ? (
                      <Chip
                        variant="static"
                        tone="neutral"
                        label={t(
                          "opportunities.classForum.statusAnswered",
                          {},
                          { default: "Answered" },
                        )}
                        leading={<CheckIcon width={18} height={18} />}
                      />
                    ) : null}
                    {isPinned ? (
                      <Chip
                        variant="static"
                        tone="neutral"
                        label={t("opportunities.classForum.pinned", {}, {
                          default: "Pinned",
                        })}
                        leading={<PinIcon width={18} height={18} />}
                      />
                    ) : null}
                    {canPlusOne ? (
                      <PlusOneButton
                        type="button"
                        aria-pressed={voted}
                        disabled={plusBusy}
                        onClick={() => handleTogglePlusOne(item)}
                        aria-label={
                          voted
                            ? t(
                                "opportunities.classForum.plusOneAriaVoted",
                                { count: upvoteCount },
                                {
                                  default:
                                    "Remove your support ({{count}})",
                                },
                              )
                            : t(
                                "opportunities.classForum.plusOneAria",
                                { count: upvoteCount },
                                {
                                  default:
                                    "Support this question ({{count}})",
                                },
                              )
                        }
                      >
                        <AddIcon />
                        {upvoteCount}
                      </PlusOneButton>
                    ) : null}
                  </HeaderActions>
                </CardHeader>

                <BodyText>{word.message}</BodyText>

                {answer && !isAnswering ? (
                  <AnswerBlock>
                    <AnswerHeading>
                      {t(
                        "opportunities.classForum.officialAnswerHeading",
                        {},
                        { default: "Answer" },
                      )}
                    </AnswerHeading>
                    <BodyText>{answer.message}</BodyText>
                    <CardMeta>
                      <span className="name">
                        {displayName(answer.author, someoneLabel)}
                      </span>
                      {answer.createdAt ? (
                        <span className="time">
                          {moment(answer.createdAt).format("MMM D, YYYY")}
                        </span>
                      ) : null}
                    </CardMeta>
                  </AnswerBlock>
                ) : null}

                {canAnswer && isAnswering ? (
                  <Compose
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveAnswer(item);
                    }}
                  >
                    <label htmlFor={answerFieldId}>
                      {t("opportunities.classForum.answerLabel", {}, {
                        default: "Official answer",
                      })}
                    </label>
                    <textarea
                      id={answerFieldId}
                      value={answerDraft}
                      onChange={(e) => setAnswerDraft(e.target.value)}
                      placeholder={t(
                        "opportunities.classForum.answerPlaceholder",
                        {},
                        { default: "Write the official answer" },
                      )}
                      rows={4}
                      disabled={answerBusy}
                    />
                    {actionError === "answer" ? (
                      <ErrorText>
                        {t("opportunities.classForum.answerFailed", {}, {
                          default:
                            "Could not save the answer. Please try again.",
                        })}
                      </ErrorText>
                    ) : null}
                    <ActionsRow>
                      <Button
                        type="button"
                        variant="text"
                        disabled={answerBusy}
                        onClick={cancelAnswerForm}
                      >
                        {t("opportunities.classForum.cancel", {}, {
                          default: "Cancel",
                        })}
                      </Button>
                      <Button
                        type="submit"
                        variant="filled"
                        disabled={answerBusy || !answerDraft.trim()}
                      >
                        {answerBusy
                          ? t("opportunities.classForum.answering", {}, {
                              default: "Saving…",
                            })
                          : t("opportunities.classForum.saveAnswer", {}, {
                              default: "Save answer",
                            })}
                      </Button>
                    </ActionsRow>
                  </Compose>
                ) : null}

                {showFooterActions && !isAnswering ? (
                  <ActionsRow>
                    {canAnswer ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => openAnswerForm(item)}
                      >
                        {answer
                          ? t("opportunities.classForum.editAnswer", {}, {
                              default: "Edit answer",
                            })
                          : t("opportunities.classForum.answer", {}, {
                              default: "Answer",
                            })}
                      </Button>
                    ) : null}
                    {canAnswer ? (
                      <Button
                        type="button"
                        variant="subtle"
                        leadingIcon={isPinned ? <UnpinIcon /> : <PinIcon />}
                        disabled={pinBusy}
                        onClick={() => handleTogglePin(item)}
                        aria-pressed={isPinned}
                        aria-label={
                          isPinned
                            ? t("opportunities.classForum.unpinAria", {}, {
                                default: "Unpin this question",
                              })
                            : t("opportunities.classForum.pinAria", {}, {
                                default: "Pin this question to the top",
                              })
                        }
                      >
                        {isPinned
                          ? t("opportunities.classForum.unpin", {}, {
                              default: "Unpin",
                            })
                          : t("opportunities.classForum.pin", {}, {
                              default: "Pin",
                            })}
                      </Button>
                    ) : null}
                    {canDeleteOwn ? (
                      <Button
                        type="button"
                        variant="text"
                        disabled={deleteBusy}
                        onClick={() => handleDeleteQuestion(item)}
                      >
                        {t("opportunities.classForum.delete", {}, {
                          default: "Delete",
                        })}
                      </Button>
                    ) : null}
                  </ActionsRow>
                ) : null}
              </QuestionCard>
            );
          })}
        </QuestionList>
      )}

      {actionError === "plusOne" ? (
        <ErrorText>
          {t("opportunities.classForum.plusOneFailed", {}, {
            default: "Could not update your support. Please try again.",
          })}
        </ErrorText>
      ) : null}

      {actionError === "pin" ? (
        <ErrorText>
          {t("opportunities.classForum.pinFailed", {}, {
            default: "Could not update the pin. Please try again.",
          })}
        </ErrorText>
      ) : null}

      {actionError === "delete" ? (
        <ErrorText>
          {t("opportunities.classForum.deleteFailed", {}, {
            default: "Could not delete this question. Please try again.",
          })}
        </ErrorText>
      ) : null}

      <Compose onSubmit={handleAsk}>
        <label htmlFor={askFieldId}>
          {t("opportunities.classForum.askLabel", {}, {
            default: "Ask a question",
          })}
        </label>
        <textarea
          id={askFieldId}
          value={askDraft}
          onChange={(e) => setAskDraft(e.target.value)}
          placeholder={t("opportunities.classForum.askPlaceholder", {}, {
            default: "Ask a question about this opportunity",
          })}
          rows={4}
          disabled={posting}
        />
        {askError ? (
          <ErrorText>
            {t("opportunities.classForum.askFailed", {}, {
              default: "Could not post your question. Please try again.",
            })}
          </ErrorText>
        ) : null}
        <ActionsRow>
          <Button
            type="submit"
            variant="filled"
            disabled={posting || !askDraft.trim()}
          >
            {posting
              ? t("opportunities.classForum.asking", {}, {
                  default: "Asking…",
                })
              : t("opportunities.classForum.ask", {}, { default: "Ask" })}
          </Button>
        </ActionsRow>
      </Compose>
    </Shell>
  );
}
