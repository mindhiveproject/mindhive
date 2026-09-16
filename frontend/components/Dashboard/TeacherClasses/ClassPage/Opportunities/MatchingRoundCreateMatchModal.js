import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import clsx from "clsx";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import Modal from "../../../../DesignSystem/Modal";
import { CREATE_MATCH, UPDATE_MATCH } from "../../../../Mutations/ConnectMatch";
import {
  countPlacedStudents,
  displayName,
  getMatchStudents,
  isStudentInActiveMatch,
} from "../../../../../lib/connectBallotUtils";
import StudentNameDisplay from "./StudentNameDisplay";

const FROSTED_CHROME_PAD_TOP = "var(--ds-modal-frosted-pad-top, 64px)";
const FROSTED_CHROME_PAD_BOTTOM = "var(--ds-modal-frosted-pad-bottom, 96px)";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  flex: 1;
  height: 100%;
  padding-top: ${FROSTED_CHROME_PAD_TOP};
  padding-bottom: ${FROSTED_CHROME_PAD_BOTTOM};
  box-sizing: border-box;

  &.isSaving {
    pointer-events: none;
    opacity: 0.72;
  }
`;

const Columns = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 0;
  flex: 1;

  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }
`;

const Column = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
`;

const ColumnTitle = styled.h3`
  margin: 0;
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d3dae0;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:disabled {
    cursor: default;
    opacity: 0.7;
    background: var(--MH-Theme-Neutrals-Lighter, #f7f9f8);
  }
`;

const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 160px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f7f9f8);
`;

const ResultButton = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  cursor: pointer;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  box-sizing: border-box;

  &:hover,
  &:focus-visible {
    border-color: var(--MH-Theme-Primary-Base, #69bbc4);
    outline: none;
  }

  &.isSelected {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    background: rgba(51, 111, 138, 0.08);
  }

  &.isDisabled {
    cursor: default;
    pointer-events: none;
  }
`;

const SelectedRow = styled.div`
  display: flex;
  align-items: flex-start;
  min-height: 40px;
`;

const SelectedChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
`;

const Meta = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const StatusCallout = styled.div`
  flex-shrink: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const ErrorNote = styled.p`
  flex-shrink: 0;
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: #b3261e;
`;

const WarningNote = styled.p`
  flex-shrink: 0;
  margin: 0;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const EmptyNote = styled.p`
  margin: 0;
  padding: 8px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const ACTIVE_ROUND_STATUSES = new Set(["published", "archived"]);

const ROUND_STATUS_LABELS = {
  draft: "Draft",
  preferences_open: "Preferences open",
  preferences_closed: "Preferences closed",
  matching: "Matching",
  published: "Published",
  archived: "Archived",
};

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function profileHaystack(profile) {
  if (!profile) return "";
  return [
    profile.firstName,
    profile.lastName,
    profile.username,
    displayName(profile),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function resolveMatchStatus(roundStatus) {
  return ACTIVE_ROUND_STATUSES.has(roundStatus) ? "active" : "proposed";
}

/**
 * Teaching-team modal: pick many students + one opportunity → create or update
 * a ConnectMatch.
 *
 * @param {object} [props.existingMatch] - When set, modal edits that match.
 */
export default function MatchingRoundCreateMatchModal({
  open,
  onClose,
  round,
  students = [],
  opportunities = [],
  preferences = [],
  matches = [],
  matchedStudentIds,
  existingMatch = null,
  onCreated,
  onUpdated,
}) {
  const { t } = useTranslation("classes");
  const isEdit = Boolean(existingMatch?.id);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [opportunityQuery, setOpportunityQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [createMatch, { loading: creating }] = useMutation(CREATE_MATCH);
  const [updateMatch, { loading: updating }] = useMutation(UPDATE_MATCH);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const saving = creating || updating || submitting;

  const preferenceBySubmitterId = useMemo(() => {
    const map = new Map();
    (preferences || []).forEach((preference) => {
      const id = preference.submitter?.id;
      if (id) map.set(id, preference);
    });
    return map;
  }, [preferences]);

  const studentById = useMemo(() => {
    const map = new Map();
    (students || []).forEach((student) => {
      if (student?.id) map.set(student.id, student);
    });
    getMatchStudents(existingMatch).forEach((student) => {
      if (student?.id && !map.has(student.id)) {
        map.set(student.id, student);
      }
    });
    return map;
  }, [students, existingMatch]);

  useEffect(() => {
    if (!open) return;
    setPeopleQuery("");
    setOpportunityQuery("");
    setErrorMessage("");
    setSubmitting(false);
    submittingRef.current = false;
    if (existingMatch?.id) {
      setSelectedStudentIds(
        getMatchStudents(existingMatch)
          .map((s) => s?.id)
          .filter(Boolean),
      );
      setSelectedOpportunityId(existingMatch.opportunity?.id || null);
    } else {
      setSelectedStudentIds([]);
      setSelectedOpportunityId(null);
    }
  }, [open, existingMatch]);

  const matchStatus = resolveMatchStatus(round?.status);
  const roundStatusLabel =
    ROUND_STATUS_LABELS[round?.status] ||
    String(round?.status || "").replace(/_/g, " ") ||
    "—";

  const peopleQ = normalizeQuery(peopleQuery);
  const opportunityQ = normalizeQuery(opportunityQuery);

  const filteredStudents = useMemo(() => {
    const roster = [...(students || [])];
    getMatchStudents(existingMatch).forEach((student) => {
      if (student?.id && !roster.some((s) => s.id === student.id)) {
        roster.push(student);
      }
    });
    return roster
      .filter((student) => student?.id)
      .filter((student) => {
        if (!peopleQ) return true;
        return profileHaystack(student).includes(peopleQ);
      })
      .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [students, peopleQ, existingMatch]);

  const filteredOpportunities = useMemo(() => {
    return (opportunities || [])
      .filter((opportunity) => opportunity?.id)
      .filter((opportunity) => {
        if (!opportunityQ) return true;
        const haystack = [
          opportunity.title,
          opportunity.organization?.name,
          ...(opportunity.sponsors || []).map(displayName),
          ...(opportunity.mentors || []).map(displayName),
          displayName(opportunity.mentor),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(opportunityQ);
      })
      .sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [opportunities, opportunityQ]);

  const selectedStudents = selectedStudentIds
    .map((id) => studentById.get(id))
    .filter(Boolean);

  const selectedOpportunity = (opportunities || []).find(
    (o) => o.id === selectedOpportunityId,
  );

  const capacityWarning = useMemo(() => {
    if (!selectedOpportunity || selectedStudentIds.length === 0) return null;
    const cap = selectedOpportunity.studentCapacity || 1;
    const alreadyPlaced = countPlacedStudents(
      (matches || []).filter(
        (m) =>
          m.opportunity?.id === selectedOpportunity.id &&
          m.id !== existingMatch?.id,
      ),
    );
    const projected = alreadyPlaced + selectedStudentIds.length;
    if (projected <= cap) return null;
    return { projected, capacity: cap, alreadyPlaced };
  }, [selectedOpportunity, selectedStudentIds, matches, existingMatch?.id]);

  const toggleStudent = useCallback((studentId) => {
    if (!studentId || saving) return;
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
    setErrorMessage("");
  }, [saving]);

  const removeStudent = useCallback((studentId) => {
    if (saving) return;
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
  }, [saving]);

  const isSelectionUnchanged = useMemo(() => {
    if (!isEdit) return false;
    const current = [...selectedStudentIds].sort().join("\0");
    const original = getMatchStudents(existingMatch)
      .map((s) => s?.id)
      .filter(Boolean)
      .sort()
      .join("\0");
    return (
      current === original &&
      selectedOpportunityId === (existingMatch?.opportunity?.id || null)
    );
  }, [isEdit, selectedStudentIds, selectedOpportunityId, existingMatch]);

  const canSubmit =
    Boolean(round?.id) &&
    selectedStudentIds.length > 0 &&
    Boolean(selectedOpportunityId) &&
    !saving &&
    !isSelectionUnchanged;

  const handleRequestClose = useCallback(() => {
    if (saving) return;
    onClose?.();
  }, [saving, onClose]);

  const handleSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setErrorMessage("");
    setSubmitting(true);

    const duplicates = selectedStudentIds.filter((studentId) =>
      (matches || []).some(
        (m) =>
          m.id !== existingMatch?.id &&
          isStudentInActiveMatch(m) &&
          m.opportunity?.id === selectedOpportunityId &&
          getMatchStudents(m).some((s) => s?.id === studentId),
      ),
    );
    if (duplicates.length) {
      const names = duplicates
        .map((id) => displayName(studentById.get(id)))
        .filter(Boolean)
        .join(", ");
      setErrorMessage(
        t(
          "opportunities.matchingRound.matching.createMatchModal.duplicateError",
          { names },
          {
            default:
              "Already matched to this opportunity: {{names}}. Remove them or pick another opportunity.",
          },
        ),
      );
      setSubmitting(false);
      submittingRef.current = false;
      return;
    }

    try {
      if (isEdit) {
        await updateMatch({
          variables: {
            id: existingMatch.id,
            input: {
              opportunity: { connect: { id: selectedOpportunityId } },
              students: {
                set: selectedStudentIds.map((id) => ({ id })),
              },
            },
          },
        });
        if (typeof onUpdated === "function") await onUpdated();
      } else {
        const now = new Date().toISOString();
        await createMatch({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              classNetwork: round.classNetwork?.id
                ? { connect: { id: round.classNetwork.id } }
                : undefined,
              opportunity: { connect: { id: selectedOpportunityId } },
              students: {
                connect: selectedStudentIds.map((id) => ({ id })),
              },
              status: matchStatus,
              proposedAt: now,
              ...(matchStatus === "active" ? { activatedAt: now } : {}),
            },
          },
        });
        if (typeof onCreated === "function") await onCreated();
      }
      onClose?.();
    } catch (err) {
      const message =
        err?.graphQLErrors?.[0]?.message ||
        err?.message ||
        t(
          isEdit
            ? "opportunities.matchingRound.matching.createMatchModal.updateFailed"
            : "opportunities.matchingRound.matching.createMatchModal.createFailed",
          {},
          {
            default: isEdit
              ? "Could not update the match. Try again."
              : "Could not create the match. Try again.",
          },
        );
      setErrorMessage(message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const statusCallout = isEdit
    ? t(
        "opportunities.matchingRound.matching.createMatchModal.statusEdit",
        {},
        {
          default:
            "Update the students or opportunity for this match. Status is unchanged.",
        },
      )
    : matchStatus === "active"
      ? t(
          "opportunities.matchingRound.matching.createMatchModal.statusActive",
          { roundStatus: roundStatusLabel },
          {
            default:
              "This match will be created as Active because the round is {{roundStatus}}.",
          },
        )
      : t(
          "opportunities.matchingRound.matching.createMatchModal.statusProposed",
          { roundStatus: roundStatusLabel },
          {
            default:
              "This match will be created as Proposed because the round is {{roundStatus}} (not published yet).",
          },
        );

  const modalTitle = isEdit
    ? t(
        "opportunities.matchingRound.matching.createMatchModal.editTitle",
        {},
        { default: "Edit match" },
      )
    : t(
        "opportunities.matchingRound.matching.createMatchModal.title",
        {},
        { default: "Create a match" },
      );

  const submitLabel = saving
    ? isEdit
      ? t(
          "opportunities.matchingRound.matching.createMatchModal.saving",
          {},
          { default: "Saving…" },
        )
      : t(
          "opportunities.matchingRound.matching.createMatchModal.creating",
          {},
          { default: "Creating…" },
        )
    : isEdit
      ? t(
          "opportunities.matchingRound.matching.createMatchModal.save",
          {},
          { default: "Save match" },
        )
      : t(
          "opportunities.matchingRound.matching.createMatchModal.submit",
          {},
          { default: "Create match" },
        );

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : handleRequestClose}
      size="large"
      maxWidth={960}
      maxHeight="90vh"
      height="90vh"
      title={modalTitle}
      frostedChrome
      hideScrollbar
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
      actions={
        <>
          <Button
            type="button"
            variant="text"
            onClick={handleRequestClose}
            disabled={saving}
          >
            {t(
              "opportunities.matchingRound.matching.createMatchModal.cancel",
              {},
              { default: "Cancel" },
            )}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <Layout
        className={clsx({ isSaving: saving })}
        aria-busy={saving}
      >
        <StatusCallout>{statusCallout}</StatusCallout>

        <Columns>
        <Column>
          <ColumnTitle>
            {t(
              "opportunities.matchingRound.matching.createMatchModal.studentsHeading",
              {},
              { default: "Students" },
            )}
          </ColumnTitle>
          <SearchInput
            type="search"
            value={peopleQuery}
            disabled={saving}
            onChange={(event) => setPeopleQuery(event.target.value)}
            placeholder={t(
              "opportunities.matchingRound.matching.createMatchModal.searchStudents",
              {},
              { default: "Search students…" },
            )}
            aria-label={t(
              "opportunities.matchingRound.matching.createMatchModal.searchStudents",
              {},
              { default: "Search students…" },
            )}
          />
          <SelectedRow>
          <SelectedChips>
            {selectedStudents.length === 0 ? (
              <Meta>
                {t(
                  "opportunities.matchingRound.matching.createMatchModal.noStudentsSelected",
                  {},
                  { default: "Select one or more students." },
                )}
              </Meta>
            ) : (
              selectedStudents.map((student) => (
                <Chip
                  key={student.id}
                  label={displayName(student)}
                  onClose={
                    saving ? undefined : () => removeStudent(student.id)
                  }
                  ariaLabel={t(
                    "opportunities.matchingRound.matching.createMatchModal.removeStudentAria",
                    { name: displayName(student) },
                    { default: "Remove {{name}}" },
                  )}
                />
              ))
            )}
          </SelectedChips>
          </SelectedRow>
          <ResultList>
            {filteredStudents.length === 0 ? (
              <EmptyNote>
                {t(
                  "opportunities.matchingRound.matching.createMatchModal.studentsEmpty",
                  {},
                  { default: "No students match this search." },
                )}
              </EmptyNote>
            ) : (
              filteredStudents.map((student) => {
                const selected = selectedStudentIds.includes(student.id);
                const showMatched =
                  matchedStudentIds?.has?.(student.id) &&
                  !selectedStudentIds.includes(student.id);
                return (
                  <li key={student.id}>
                    <ResultButton
                      role="button"
                      tabIndex={saving ? -1 : 0}
                      className={clsx({
                        isSelected: selected,
                        isDisabled: saving,
                      })}
                      onClick={() => toggleStudent(student.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleStudent(student.id);
                        }
                      }}
                      aria-pressed={selected}
                      aria-disabled={saving}
                    >
                      <StudentNameDisplay
                        student={student}
                        preference={
                          preferenceBySubmitterId.get(student.id) || null
                        }
                        matched={showMatched}
                      />
                    </ResultButton>
                  </li>
                );
              })
            )}
          </ResultList>
        </Column>

        <Column>
          <ColumnTitle>
            {t(
              "opportunities.matchingRound.matching.createMatchModal.opportunityHeading",
              {},
              { default: "Opportunity" },
            )}
          </ColumnTitle>
          <SearchInput
            type="search"
            value={opportunityQuery}
            disabled={saving}
            onChange={(event) => setOpportunityQuery(event.target.value)}
            placeholder={t(
              "opportunities.matchingRound.matching.createMatchModal.searchOpportunities",
              {},
              { default: "Search opportunities…" },
            )}
            aria-label={t(
              "opportunities.matchingRound.matching.createMatchModal.searchOpportunities",
              {},
              { default: "Search opportunities…" },
            )}
          />
          <SelectedRow>
          {selectedOpportunity ? (
            <Meta>
              {t(
                "opportunities.matchingRound.matching.createMatchModal.selectedOpportunity",
                { title: selectedOpportunity.title || "—" },
                { default: "Selected: {{title}}" },
              )}
            </Meta>
          ) : (
            <Meta>
              {t(
                "opportunities.matchingRound.matching.createMatchModal.noOpportunitySelected",
                {},
                { default: "Select one opportunity." },
              )}
            </Meta>
          )}
          </SelectedRow>
          <ResultList>
            {filteredOpportunities.length === 0 ? (
              <EmptyNote>
                {t(
                  "opportunities.matchingRound.matching.createMatchModal.opportunitiesEmpty",
                  {},
                  { default: "No opportunities match this search." },
                )}
              </EmptyNote>
            ) : (
              filteredOpportunities.map((opportunity) => {
                const selected = opportunity.id === selectedOpportunityId;
                const people = [
                  ...(opportunity.sponsors || []),
                  ...(opportunity.mentors || []),
                  opportunity.mentor,
                ]
                  .filter(Boolean)
                  .map(displayName)
                  .filter(Boolean);
                const uniquePeople = [...new Set(people)];
                return (
                  <li key={opportunity.id}>
                    <ResultButton
                      role="button"
                      tabIndex={saving ? -1 : 0}
                      className={clsx({
                        isSelected: selected,
                        isDisabled: saving,
                      })}
                      onClick={() => {
                        if (saving) return;
                        setSelectedOpportunityId(opportunity.id);
                        setErrorMessage("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          if (saving) return;
                          setSelectedOpportunityId(opportunity.id);
                          setErrorMessage("");
                        }
                      }}
                      aria-pressed={selected}
                      aria-disabled={saving}
                    >
                      <span>
                        <strong>{opportunity.title || "—"}</strong>
                        {uniquePeople.length > 0 ? (
                          <Meta as="span" style={{ display: "block" }}>
                            {uniquePeople.join(", ")}
                          </Meta>
                        ) : null}
                      </span>
                    </ResultButton>
                  </li>
                );
              })
            )}
          </ResultList>
        </Column>
        </Columns>

        {capacityWarning ? (
          <WarningNote>
            {t(
              "opportunities.matchingRound.matching.createMatchModal.capacityWarning",
              {
                projected: capacityWarning.projected,
                capacity: capacityWarning.capacity,
              },
              {
                default:
                  "Warning: this would place {{projected}} students on an opportunity with capacity {{capacity}}.",
              },
            )}
          </WarningNote>
        ) : null}

        {errorMessage ? <ErrorNote>{errorMessage}</ErrorNote> : null}
      </Layout>
    </Modal>
  );
}
