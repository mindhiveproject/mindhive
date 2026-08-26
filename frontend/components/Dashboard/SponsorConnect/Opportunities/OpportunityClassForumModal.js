import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import Modal from "../../../DesignSystem/Modal";
import { GET_OPPORTUNITY } from "../../../Queries/Opportunity";
import OpportunityClassForum from "../../Connect/OpportunityClassForum";

const Body = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

const StatusText = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

const FieldBlock = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;

  label {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

function classEntry(cls) {
  if (!cls?.id) return null;
  return {
    id: cls.id,
    title: cls.title || cls.code || cls.id,
    code: cls.code || null,
  };
}

function isFaqTalk(talk) {
  const kind = talk?.settings?.kind;
  if (!kind) return true;
  return kind === "opportunityClassFaq" || kind === "opportunityClassForum";
}

function uniqueSortedClasses(items) {
  const byId = new Map();
  for (const cls of items) {
    if (!cls?.id || byId.has(cls.id)) continue;
    byId.set(cls.id, cls);
  }
  return Array.from(byId.values()).sort((a, b) =>
    String(a.title).localeCompare(String(b.title)),
  );
}

/**
 * Classes the sponsor can open a FAQ for.
 * Prefer classes that already have an opportunity × class Talk (the active
 * thread). A round's class network can list many classes that never opened
 * a FAQ — those should not force a picker when only one thread exists.
 * If no Talk exists yet, fall back to unique classes on the opportunity's
 * matching-round networks so a sponsor can still start the first room.
 */
export function collectOpportunityForumClasses(opportunity) {
  const fromTalks = [];
  for (const talk of opportunity?.talks || []) {
    if (!isFaqTalk(talk)) continue;
    for (const cls of talk?.classes || []) {
      const entry = classEntry(cls);
      if (entry) fromTalks.push(entry);
    }
  }
  const talkClasses = uniqueSortedClasses(fromTalks);
  if (talkClasses.length > 0) return talkClasses;

  const fromRounds = [];
  for (const round of opportunity?.rounds || []) {
    for (const cls of round?.classNetwork?.classes || []) {
      const entry = classEntry(cls);
      if (entry) fromRounds.push(entry);
    }
  }
  return uniqueSortedClasses(fromRounds);
}

/**
 * Sponsor-facing modal: pick a class, then show that opportunity × class FAQ.
 * Separate from OpportunityChatModal (review notes).
 */
export default function OpportunityClassForumModal({
  open,
  onClose,
  opportunityId,
  user,
}) {
  const { t } = useTranslation("connect");
  const [classId, setClassId] = useState(null);

  useEffect(() => {
    if (!open) {
      setClassId(null);
    }
  }, [open, opportunityId]);

  const { data, loading, error } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: !open || !opportunityId,
    fetchPolicy: "cache-and-network",
  });

  const opportunity = data?.opportunity;
  const classes = useMemo(
    () => collectOpportunityForumClasses(opportunity),
    [opportunity],
  );

  useEffect(() => {
    if (!open || !classes.length) return;
    if (classId && classes.some((c) => c.id === classId)) return;
    setClassId(classes.length === 1 ? classes[0].id : null);
  }, [open, classes, classId]);

  const showClassPicker = classes.length > 1;

  const classOptions = useMemo(
    () =>
      classes.map((cls) => ({
        value: cls.id,
        label: cls.title,
        labelText: cls.title,
      })),
    [classes],
  );

  const title = opportunity?.title
    ? t(
        "myOpportunitiesList.classForum.modalTitleNamed",
        { title: opportunity.title },
        { default: "Class FAQ · {{title}}" },
      )
    : t("myOpportunitiesList.classForum.modalTitle", {}, {
        default: "Class FAQ",
      });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      title={title}
      actions={
        <Button type="button" variant="outline" onClick={onClose}>
          {t("myOpportunitiesList.modals.close", {}, { default: "Close" })}
        </Button>
      }
    >
      {loading && !opportunity ? (
        <StatusText>
          {t("opportunityEditor.loading", {}, {
            default: "Loading opportunity…",
          })}
        </StatusText>
      ) : null}
      {error ? (
        <StatusText>
          {t("myOpportunitiesList.modals.loadError", {}, {
            default: "Could not load this opportunity. Please try again.",
          })}
        </StatusText>
      ) : null}
      {opportunity ? (
        <Body>
          {classes.length === 0 ? (
            <StatusText>
              {t("myOpportunitiesList.classForum.noClasses", {}, {
                default:
                  "No classes are linked to this opportunity’s matching rounds yet.",
              })}
            </StatusText>
          ) : (
            <>
              {showClassPicker ? (
                <FieldBlock>
                  <label id="opp-class-forum-class-label">
                    {t("myOpportunitiesList.classForum.pickClass", {}, {
                      default: "Choose a class",
                    })}
                  </label>
                  <DropdownSelect
                    value={classId || ""}
                    onChange={setClassId}
                    options={classOptions}
                    ariaLabel={t(
                      "myOpportunitiesList.classForum.pickClass",
                      {},
                      { default: "Choose a class" },
                    )}
                    placeholder={t(
                      "myOpportunitiesList.classForum.pickClassPlaceholder",
                      {},
                      { default: "Select a class" },
                    )}
                    searchableSingle={classes.length > 6}
                  />
                </FieldBlock>
              ) : null}
              {classId ? (
                <OpportunityClassForum
                  opportunityId={opportunityId}
                  classId={classId}
                  user={user}
                />
              ) : (
                <StatusText>
                  {t("myOpportunitiesList.classForum.selectClassHint", {}, {
                    default: "Select a class to view or ask questions in its FAQ.",
                  })}
                </StatusText>
              )}
            </>
          )}
        </Body>
      ) : null}
    </Modal>
  );
}
