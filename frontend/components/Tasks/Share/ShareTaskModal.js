import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";
import styled from "styled-components";

import Modal from "../../DesignSystem/Modal";
import Button from "../../DesignSystem/Button";
import Input from "../../DesignSystem/Input";
import Checkbox from "../../DesignSystem/Checkbox";
import Radio from "../../DesignSystem/Radio";
import Chip from "../../DesignSystem/Chip";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import MessageCard from "../../DesignSystem/MessageCard";
import LoadingIcon from "../../DesignSystem/LoadingIcon";
import { TASK_SHARE_TARGETS, MY_SENT_TASK_SHARES } from "../../Queries/TaskShare";
import { SHARE_TASK, WITHDRAW_TASK_SHARE } from "../../Mutations/TaskShare";
import { getLocalizedField } from "../../../lib/i18nContent";

const TYPE_WORDS = {
  TASK: { key: "shareCopy.typeTask", default: "task" },
  SURVEY: { key: "shareCopy.typeSurvey", default: "survey" },
  BLOCK: { key: "shareCopy.typeBlock", default: "block" },
};

const StyledShare = styled.div`
  display: grid;
  gap: 20px;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  h4 {
    margin: 0 0 8px;
    font: var(--MH-Type-Title-Small);
  }

  .muted {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .options {
    display: grid;
    gap: 4px;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 12px;
    border-radius: 8px;
    cursor: pointer;
    font: var(--MH-Type-Body-Base);
    &:hover {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    }
    &.isDisabled {
      cursor: default;
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      &:hover {
        background: none;
      }
    }
    .optionText {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .optionHint {
      font: var(--MH-Type-Body-Small);
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
  }

  .people {
    display: grid;
    gap: 8px;
  }

  .peopleToolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    .search {
      flex: 1 1 220px;
    }
  }

  .peopleList {
    max-height: 280px;
    overflow-y: auto;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    padding: 4px;
  }

  .groupLabel {
    margin: 8px 12px 4px;
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .sentList {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sentRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    font: var(--MH-Type-Body-Base);
    .sentText {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
  }
`;

// Up to this many classes are listed as choices; more go in a dropdown.
const MAX_CLASS_RADIOS = 3;

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person?.username || "";
}

/**
 * Share a copy of a task, survey or block with people in one of your classes.
 * Nobody becomes a collaborator: each recipient adds their own independent
 * copy from Develop › Shared with me.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {object} task - Needs `id`, `title`, `taskType` (and `i18nContent`).
 * @param {object} user - The signed-in user.
 */
export default function ShareTaskModal({ open, onClose, task, user }) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();
  const [classId, setClassId] = useState(null);
  const [mode, setMode] = useState("people");
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [sharedTo, setSharedTo] = useState(null);

  const title = getLocalizedField(task, "title", locale) || task?.title || "";
  const typeWord = TYPE_WORDS[task?.taskType] || TYPE_WORDS.TASK;
  const kind = t(typeWord.key, {}, { default: typeWord.default });

  const { data, loading, error } = useQuery(TASK_SHARE_TARGETS, {
    variables: { taskId: task?.id },
    skip: !open || !task?.id,
    fetchPolicy: "network-only",
  });
  const { data: sentData } = useQuery(MY_SENT_TASK_SHARES, {
    variables: { taskId: task?.id, me: user?.id },
    skip: !open || !task?.id || !user?.id,
    fetchPolicy: "network-only",
  });
  const refetchSent = [
    {
      query: MY_SENT_TASK_SHARES,
      variables: { taskId: task?.id, me: user?.id },
    },
  ];
  const [shareTask, { loading: sharing, error: shareError, reset }] =
    useMutation(SHARE_TASK, { refetchQueries: refetchSent });
  const [withdraw, { loading: withdrawing }] = useMutation(
    WITHDRAW_TASK_SHARE,
    { refetchQueries: refetchSent }
  );

  const classes = data?.taskShareTargets || [];
  const klass = classes.find((c) => c.id === classId) || null;

  // Start each opening fresh, on the first class you can share in.
  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    setMessage("");
    setSharedTo(null);
    setClassId(null);
    reset?.();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // With a few classes, start on the first one you can share in; with many,
  // let the person pick, so nothing goes to a class they didn't choose.
  useEffect(() => {
    if (!open || !classes.length) return;
    const shareable = classes.filter((c) => c.canShare);
    const preselect =
      classes.length <= MAX_CLASS_RADIOS || shareable.length === 1;
    setClassId((current) =>
      shareable.some((c) => c.id === current)
        ? current
        : preselect
          ? shareable[0]?.id || null
          : null
    );
  }, [open, classes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelected(new Set());
    setSearch("");
    setMode(klass?.canShareWithClass ? "class" : "people");
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const term = search.trim().toLowerCase();
  const members = klass?.members || [];
  const filtered = members.filter(
    (m) => !term || m.name.toLowerCase().includes(term)
  );
  const staff = filtered.filter((m) => m.role !== "student");
  const students = filtered.filter((m) => m.role === "student");

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((m) =>
        allFilteredSelected ? next.delete(m.id) : next.add(m.id)
      );
      return next;
    });

  const sent = (sentData?.taskShareInvites || []).filter(
    (invite) => invite.status === "active"
  );

  const canSubmit =
    !!klass?.canShare &&
    (mode === "class" ? klass.studentCount > 0 : selected.size > 0);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await shareTask({
        variables: {
          taskId: task.id,
          classId: klass.id,
          wholeClass: mode === "class",
          recipientIds: mode === "class" ? [] : [...selected],
          message: message.trim(),
        },
      });
    } catch {
      return; // shown from the mutation's error state
    }
    setSharedTo(
      mode === "class"
        ? t("shareCopy.doneClass", { classTitle: klass.title }, {
            default: `Shared with everyone in ${klass.title}.`,
          })
        : t("shareCopy.donePeople", { count: selected.size }, {
            default:
              selected.size === 1
                ? "Shared with 1 person."
                : `Shared with ${selected.size} people.`,
          })
    );
    setSelected(new Set());
    setMessage("");
  };

  const roleLabel = (role) =>
    role === "teacher"
      ? t("shareCopy.roleTeacher", {}, { default: "Teacher" })
      : role === "mentor"
        ? t("shareCopy.roleMentor", {}, { default: "Mentor" })
        : null;

  const renderPerson = (m) => {
    const isChecked = selected.has(m.id);
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div
        key={m.id}
        className="option"
        onClick={(e) => {
          if (!e.target.closest("button")) toggle(m.id);
        }}
      >
        <Checkbox
          checked={isChecked}
          onChange={() => toggle(m.id)}
          ariaLabel={m.name}
        />
        <span className="optionText">{m.name}</span>
        {roleLabel(m.role) && (
          <Chip variant="static" tone="neutral" label={roleLabel(m.role)} />
        )}
      </div>
    );
  };

  const sentSummary = (invite) => {
    if (invite.wholeClass) {
      return t("shareCopy.sentWholeClass", { classTitle: invite.class?.title }, {
        default: `Everyone in ${invite.class?.title || "the class"}`,
      });
    }
    const names = (invite.recipients || []).map(personName).filter(Boolean);
    const shown = names.slice(0, 3).join(", ");
    return names.length > 3
      ? t("shareCopy.sentNamesMore", { names: shown, more: names.length - 3 }, {
          default: `${shown} and ${names.length - 3} more`,
        })
      : shown;
  };

  const shareableClasses = classes.filter((c) => c.canShare);

  return (
    <Modal
      open={open}
      onClose={sharing ? undefined : onClose}
      maxWidth={560}
      maxHeight="90vh"
      title={
        <span className="MH-Type-Title-Large">
          {t("shareCopy.title", { title }, { default: `Share a copy of “${title}”` })}
        </span>
      }
      actions={
        sharedTo ? (
          <Button variant="filled" onClick={onClose}>
            {t("shareCopy.close", {}, { default: "Done" })}
          </Button>
        ) : (
          <>
            <Button variant="text" onClick={onClose} disabled={sharing}>
              {t("shareCopy.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              onClick={submit}
              disabled={!canSubmit || sharing}
            >
              {sharing
                ? t("shareCopy.sharing", {}, { default: "Sharing…" })
                : t("shareCopy.submit", {}, { default: "Share" })}
            </Button>
          </>
        )
      }
    >
      <StyledShare>
        <MessageCard
          variant="information"
          message={t(
            "shareCopy.explainer",
            { kind },
            {
              default: `Each person gets their own copy of this ${kind} to edit. Your later changes won't reach them, and theirs won't reach you. They won't see your data or become a collaborator. Edits to the template's code still reach every copy that runs it.`,
            }
          )}
        />

        {sharedTo && (
          <MessageCard
            variant="success"
            message={`${sharedTo} ${t("shareCopy.doneHint", {}, {
              default:
                "They'll find it in Develop under “Shared with me”, where they can add their copy.",
            })}`}
          />
        )}

        {loading && (
          <p className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LoadingIcon size={20} />
            {t("shareCopy.loading", {}, { default: "Loading your classes…" })}
          </p>
        )}

        {(error || shareError) && (
          <MessageCard
            variant="warning"
            message={
              shareError?.graphQLErrors?.[0]?.message ||
              error?.graphQLErrors?.[0]?.message ||
              t("shareCopy.error", {}, {
                default: "Something went wrong. Please try again.",
              })
            }
          />
        )}

        {!loading && !error && !sharedTo && classes.length === 0 && (
          <MessageCard
            variant="neutral"
            message={t("shareCopy.noClasses", {}, {
              default:
                "You can share with people in your classes. Join or create a class first.",
            })}
          />
        )}

        {!sharedTo && classes.length > 0 && (
          <>
            {classes.length > MAX_CLASS_RADIOS && (
              <section>
                <h4>{t("shareCopy.classHeading", {}, { default: "Class" })}</h4>
                <DropdownSelect
                  value={classId}
                  onChange={setClassId}
                  searchableSingle
                  portal
                  ariaLabel={t("shareCopy.classHeading", {}, { default: "Class" })}
                  searchPlaceholder={t("shareCopy.searchClasses", {}, {
                    default: "Search classes",
                  })}
                  placeholder={t("shareCopy.chooseClass", {}, {
                    default: "Choose a class",
                  })}
                  options={classes.map((c) => ({
                    value: c.id,
                    label: c.title,
                    disabled: !c.canShare,
                  }))}
                />
                {klass && !klass.canShare && (
                  <p className="muted" style={{ marginTop: 8 }}>
                    {t("shareCopy.classSharingOff", {}, {
                      default:
                        "Your teacher turned off sharing between students in this class.",
                    })}
                  </p>
                )}
              </section>
            )}

            {classes.length > 1 && classes.length <= MAX_CLASS_RADIOS && (
              <section>
                <h4>{t("shareCopy.classHeading", {}, { default: "Class" })}</h4>
                <div className="options" role="radiogroup">
                  {classes.map((c) => (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                    <div
                      key={c.id}
                      className={`option${c.canShare ? "" : " isDisabled"}`}
                      onClick={() => c.canShare && setClassId(c.id)}
                    >
                      <Radio
                        checked={classId === c.id}
                        onChange={() => setClassId(c.id)}
                        disabled={!c.canShare}
                        ariaLabel={c.title}
                      />
                      <span className="optionText">
                        <span>{c.title}</span>
                        {!c.canShare && (
                          <span className="optionHint">
                            {t("shareCopy.classSharingOff", {}, {
                              default:
                                "Your teacher turned off sharing between students in this class.",
                            })}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {classes.length === 1 && (
              <p className="muted">
                {t("shareCopy.inClass", { classTitle: classes[0].title }, {
                  default: `In ${classes[0].title}`,
                })}
              </p>
            )}

            {!shareableClasses.length && (
              <MessageCard
                variant="neutral"
                message={t("shareCopy.allSharingOff", {}, {
                  default:
                    "Your teachers turned off sharing between students in your classes.",
                })}
              />
            )}

            {klass?.canShare && (
              <section>
                <h4>{t("shareCopy.withHeading", {}, { default: "Share with" })}</h4>
                {klass.canShareWithClass && (
                  <div className="options" role="radiogroup">
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div className="option" onClick={() => setMode("class")}>
                      <Radio
                        checked={mode === "class"}
                        onChange={() => setMode("class")}
                        ariaLabel={t("shareCopy.wholeClass", {}, {
                          default: "The whole class",
                        })}
                      />
                      <span className="optionText">
                        <span>
                          {t("shareCopy.wholeClass", {}, {
                            default: "The whole class",
                          })}
                        </span>
                        <span className="optionHint">
                          {t("shareCopy.wholeClassHint", { count: klass.studentCount }, {
                            default: `All ${klass.studentCount} students, and students who join later`,
                          })}
                        </span>
                      </span>
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div className="option" onClick={() => setMode("people")}>
                      <Radio
                        checked={mode === "people"}
                        onChange={() => setMode("people")}
                        ariaLabel={t("shareCopy.somePeople", {}, {
                          default: "Selected people",
                        })}
                      />
                      <span className="optionText">
                        {t("shareCopy.somePeople", {}, {
                          default: "Selected people",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {mode === "people" && (
                  <div className="people" style={{ marginTop: 8 }}>
                    {members.length === 0 ? (
                      <MessageCard
                        variant="neutral"
                        message={t("shareCopy.nobody", {}, {
                          default: "There is nobody else in this class yet.",
                        })}
                      />
                    ) : (
                      <>
                        <div className="peopleToolbar">
                          <div className="search">
                            <Input
                              type="search"
                              value={search}
                              onChange={setSearch}
                              placeholder={t("shareCopy.search", {}, {
                                default: "Search people",
                              })}
                              aria-label={t("shareCopy.search", {}, {
                                default: "Search people",
                              })}
                            />
                          </div>
                          <Button
                            variant="text"
                            onClick={toggleAllFiltered}
                            disabled={!filtered.length}
                          >
                            {allFilteredSelected
                              ? t("shareCopy.clearAll", {}, { default: "Clear" })
                              : t("shareCopy.selectAll", {}, { default: "Select all" })}
                          </Button>
                          <span className="muted" aria-live="polite">
                            {t("shareCopy.selectedCount", { count: selected.size }, {
                              default: `${selected.size} selected`,
                            })}
                          </span>
                        </div>
                        <div className="peopleList">
                          {staff.length > 0 && (
                            <>
                              <p className="groupLabel">
                                {t("shareCopy.groupStaff", {}, {
                                  default: "Teachers & mentors",
                                })}
                              </p>
                              {staff.map(renderPerson)}
                            </>
                          )}
                          {students.length > 0 && (
                            <>
                              <p className="groupLabel">
                                {t("shareCopy.groupStudents", {}, {
                                  default: "Students",
                                })}
                              </p>
                              {students.map(renderPerson)}
                            </>
                          )}
                          {!filtered.length && (
                            <p className="muted" style={{ padding: "8px 12px" }}>
                              {t("shareCopy.noMatches", {}, {
                                default: "Nobody matches your search.",
                              })}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            )}

            {klass?.canShare && (
              <Input
                multiline
                rows={2}
                value={message}
                onChange={setMessage}
                maxLength={1000}
                label={t("shareCopy.messageLabel", {}, {
                  default: "Message (optional)",
                })}
                placeholder={t("shareCopy.messagePlaceholder", {}, {
                  default: "Add a note about what to do with it",
                })}
              />
            )}
          </>
        )}

        {sent.length > 0 && (
          <section>
            <h4>{t("shareCopy.sentHeading", {}, { default: "Already shared" })}</h4>
            <ul className="sentList">
              {sent.map((invite) => (
                <li key={invite.id} className="sentRow">
                  <span className="sentText">
                    <span>{sentSummary(invite)}</span>
                    <span className="muted">
                      {[
                        invite.wholeClass ? null : invite.class?.title,
                        moment(invite.createdAt).format("MMM D, YYYY"),
                        t("shareCopy.sentAdded", { count: invite.acceptedByCount }, {
                          default: `${invite.acceptedByCount} added a copy`,
                        }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <Button
                    variant="text"
                    disabled={withdrawing}
                    onClick={() => {
                      if (
                        window.confirm(
                          t("shareCopy.withdrawConfirm", {}, {
                            default:
                              "Withdraw this share? People who already added a copy keep it.",
                          })
                        )
                      ) {
                        withdraw({ variables: { inviteId: invite.id } }).catch(
                          (err) => alert(err?.graphQLErrors?.[0]?.message || err?.message)
                        );
                      }
                    }}
                  >
                    {t("shareCopy.withdraw", {}, { default: "Withdraw" })}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </StyledShare>
    </Modal>
  );
}
