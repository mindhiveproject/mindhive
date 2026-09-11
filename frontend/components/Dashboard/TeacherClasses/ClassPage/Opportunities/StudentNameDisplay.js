import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import clsx from "clsx";

import Chip from "../../../../DesignSystem/Chip";
import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";
import Tooltip from "../../../../DesignSystem/Tooltip";
import { displayName } from "../../../../../lib/connectBallotUtils";
import {
  getMatchingQueue,
  MATCHING_QUEUE_PROJECT_FIRST,
  MATCHING_QUEUE_TEAM_FIRST,
} from "../../../../../lib/connectPreferenceMatchingPreference";
import { UPDATE_PREFERENCE } from "../../../../Mutations/ConnectPreference";

const Root = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
`;

const NameButton = styled.button`
  appearance: none;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Base, #69bbc4);
    outline-offset: 2px;
  }
`;

const NameText = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NoteField = styled.textarea`
  display: block;
  width: 100%;
  min-height: 280px;
  margin: 0;
  padding: 10px 12px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font: var(--MH-Type-Body-Base);
  resize: vertical;

  &:focus {
    outline: 2px solid var(--MH-Theme-Primary-Base, #69bbc4);
    outline-offset: 1px;
  }
`;

const COMPACT_CHIP_STYLE = {
  height: 20,
  padding: "0 6px",
  font: 'var(--MH-Type-Label-Sm, 500 12px/16px "Inter", sans-serif)',
};

/**
 * Teacher-facing student name with optional T/P queue chip and a private
 * teaching-team note modal (ConnectPreference.teachingTeamNote).
 *
 * @param {object} props
 * @param {object} props.student
 * @param {{ id?: string, studentMatchingPreference?: unknown, teachingTeamNote?: string } | null} [props.preference]
 * @param {string} [props.className]
 */
export default function StudentNameDisplay({
  student,
  preference = null,
  className,
}) {
  const { t } = useTranslation("classes");
  const preferenceId = preference?.id || null;
  const canOpenNotes = Boolean(preferenceId);
  const name = displayName(student);

  const queue = getMatchingQueue(preference?.studentMatchingPreference);
  const queueChip =
    queue === MATCHING_QUEUE_TEAM_FIRST
      ? {
          label: t(
            "opportunities.matchingRound.studentName.queueTeamShort",
            {},
            { default: "T" },
          ),
          tooltip: t(
            "opportunities.matchingRound.studentName.queueTeamTooltip",
            {},
            { default: "Team first" },
          ),
        }
      : queue === MATCHING_QUEUE_PROJECT_FIRST
        ? {
            label: t(
              "opportunities.matchingRound.studentName.queueProjectShort",
              {},
              { default: "P" },
            ),
            tooltip: t(
              "opportunities.matchingRound.studentName.queueProjectTooltip",
              {},
              { default: "Project first" },
            ),
          }
        : null;

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(preference?.teachingTeamNote || "");
  const [updatePreference, { loading: saving }] = useMutation(
    UPDATE_PREFERENCE,
  );

  useEffect(() => {
    if (!modalOpen) {
      setDraft(preference?.teachingTeamNote || "");
    }
  }, [preference?.teachingTeamNote, modalOpen]);

  const openModal = (event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    if (!canOpenNotes) return;
    setDraft(preference?.teachingTeamNote || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!preferenceId || saving) return;
    try {
      await updatePreference({
        variables: {
          id: preferenceId,
          input: { teachingTeamNote: draft },
        },
      });
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to save teaching team note", error);
    }
  };

  return (
    <Root className={clsx("matchingRoundStudentNameDisplay", className)}>
      {canOpenNotes ? (
        <NameButton
          type="button"
          onClick={openModal}
          aria-label={t(
            "opportunities.matchingRound.studentName.openNotesAria",
            { name },
            { default: "Open teaching team notes for {{name}}" },
          )}
        >
          {name}
        </NameButton>
      ) : (
        <NameText>{name}</NameText>
      )}

      {queueChip ? (
        <Tooltip content={queueChip.tooltip} side="top">
          <span>
            <Chip
              variant="static"
              tone="neutral"
              label={queueChip.label}
              style={COMPACT_CHIP_STYLE}
              truncate={false}
              ariaLabel={queueChip.tooltip}
            />
          </span>
        </Tooltip>
      ) : null}

      {canOpenNotes ? (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          maxWidth={640}
          maxHeight="80vh"
          title={t(
            "opportunities.matchingRound.studentName.notesTitle",
            { name },
            { default: "Notes on {{name}}" },
          )}
          actions={
            <>
              <Button
                type="button"
                variant="text"
                onClick={closeModal}
                disabled={saving}
              >
                {t(
                  "opportunities.matchingRound.studentName.cancel",
                  {},
                  { default: "Cancel" },
                )}
              </Button>
              <Button
                type="button"
                variant="filled"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? t(
                      "opportunities.matchingRound.studentName.saving",
                      {},
                      { default: "Saving…" },
                    )
                  : t(
                      "opportunities.matchingRound.studentName.save",
                      {},
                      { default: "Save" },
                    )}
              </Button>
            </>
          }
        >
          <label
            htmlFor={`teaching-team-note-${preferenceId}`}
            style={{
              display: "block",
              marginBottom: 8,
              font: "var(--MH-Type-Body-Base)",
              color: "var(--MH-Theme-Neutrals-Black, #171717)",
            }}
          >
            {t(
              "opportunities.matchingRound.studentName.notesLabel",
              {},
              {
                default:
                  "Private notes for the teaching team. Students cannot see these.",
              },
            )}
          </label>
          <NoteField
            id={`teaching-team-note-${preferenceId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={saving}
          />
        </Modal>
      ) : null}
    </Root>
  );
}
