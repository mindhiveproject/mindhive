import { useCallback, useMemo, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import { AddIcon, CloseIcon } from "../../../../DesignSystem/Icons";

const ListShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  .smooth-dnd-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 4px;
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionLabel = styled.h3`
  margin: 0;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const PoolToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const PoolToggleIcon = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const PoolBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #d3dae0);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &::placeholder {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const ChipPool = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RankRow = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  min-width: 0;
`;

const DragHandle = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const StudentName = styled.span`
  font: var(--MH-Type-Title-Small, 600 16px/22px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const Hint = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

function reorderArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function studentDisplayName(student) {
  if (!student) return "";
  const full = [student.firstName, student.lastName].filter(Boolean).join(" ");
  return full || student.username || "";
}

export function deriveClassmateOrder(existingTeamPrefs, teamEligibleOppIds) {
  if (!teamEligibleOppIds?.length) return [];

  const byOpp = new Map();
  (existingTeamPrefs || []).forEach((tp) => {
    const oppId = tp.opportunity?.id;
    const tmId = tp.preferredTeammate?.id;
    if (!oppId || !tmId || !teamEligibleOppIds.includes(oppId)) return;
    if (!byOpp.has(oppId)) byOpp.set(oppId, []);
    byOpp.get(oppId).push({ tmId, priority: tp.priority ?? 999 });
  });

  for (const oppId of teamEligibleOppIds) {
    const entries = byOpp.get(oppId);
    if (entries?.length) {
      return entries
        .sort((a, b) => a.priority - b.priority)
        .map((e) => e.tmId);
    }
  }
  return [];
}

export default function ClassmateRankList({
  students,
  classmateOrder,
  onClassmateOrderChange,
  maxPicks = 0,
  rankingEnabled = true,
}) {
  const { t } = useTranslation("classes");
  const [search, setSearch] = useState("");
  const [poolOpen, setPoolOpen] = useState(true);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students || []) {
      if (s?.id) map.set(s.id, s);
    }
    return map;
  }, [students]);

  const atMax = maxPicks > 0 && classmateOrder.length >= maxPicks;

  const availableStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (students || []).filter((s) => {
      if (!s?.id || classmateOrder.includes(s.id)) return false;
      if (!query) return true;
      return studentDisplayName(s).toLowerCase().includes(query);
    });
  }, [students, classmateOrder, search]);

  const showPool =
    rankingEnabled && !atMax && (students?.length || 0) > classmateOrder.length;

  const handleAdd = (studentId) => {
    if (!studentId || !rankingEnabled || atMax) return;
    onClassmateOrderChange([...classmateOrder, studentId]);
  };

  const handleRemove = (studentId) => {
    if (!rankingEnabled) return;
    onClassmateOrderChange(classmateOrder.filter((id) => id !== studentId));
  };

  const handleDrop = useCallback(
    ({ removedIndex, addedIndex }) => {
      if (!rankingEnabled) return;
      if (removedIndex == null || addedIndex == null) return;
      if (removedIndex === addedIndex) return;
      onClassmateOrderChange(reorderArray(classmateOrder, removedIndex, addedIndex));
    },
    [classmateOrder, onClassmateOrderChange, rankingEnabled],
  );

  const dragHint = t("opportunities.studentView.rankForm.dragHint", {}, {
    default: "Drag to reorder",
  });

  const renderRow = (studentId, index, wrapDraggable) => {
    const student = studentById.get(studentId);
    if (!student) return null;
    const rank = index + 1;
    const name = studentDisplayName(student);
    const removeLabel = t(
      "opportunities.studentView.rankForm.classmatesRemove",
      { name },
      { default: "Remove {{name}}" },
    );

    const row = (
      <RankRow>
        <DragHandle
          className="classmate-drag-handle"
          aria-disabled={!rankingEnabled}
          title={dragHint}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <circle cx="4" cy="3" r="1.25" fill="currentColor" />
            <circle cx="10" cy="3" r="1.25" fill="currentColor" />
            <circle cx="4" cy="7" r="1.25" fill="currentColor" />
            <circle cx="10" cy="7" r="1.25" fill="currentColor" />
            <circle cx="4" cy="11" r="1.25" fill="currentColor" />
            <circle cx="10" cy="11" r="1.25" fill="currentColor" />
          </svg>
        </DragHandle>
        <Chip
          variant="static"
          tone="neutral"
          label={String(rank)}
          ariaLabel={t(
            "opportunities.studentView.rankForm.rankBadge",
            { rank },
            { default: "Rank {{rank}}" },
          )}
        />
        <StudentName title={name}>{name}</StudentName>
        {rankingEnabled ? (
          <IconButton
            variant="subtle"
            ariaLabel={removeLabel}
            title={removeLabel}
            onClick={() => handleRemove(studentId)}
            icon={<CloseIcon width={18} height={18} aria-hidden />}
          />
        ) : null}
      </RankRow>
    );

    if (wrapDraggable) {
      return <Draggable key={studentId}>{row}</Draggable>;
    }
    return <div key={studentId}>{row}</div>;
  };

  const poolToggleLabel = t(
    "opportunities.studentView.rankForm.classmatesPoolToggle",
    {},
    { default: "Add classmates from your class" },
  );

  return (
    <ListShell>
      {classmateOrder.length > 0 ? (
        <Section>
          <SectionLabel>
            {t("opportunities.studentView.rankForm.classmatesRanked", {}, {
              default: "Your ranked classmates",
            })}
          </SectionLabel>
          {rankingEnabled ? (
            <Container
              dragHandleSelector=".classmate-drag-handle"
              lockAxis="y"
              onDrop={handleDrop}
            >
              {classmateOrder.map((id, index) => renderRow(id, index, true))}
            </Container>
          ) : (
            classmateOrder.map((id, index) => renderRow(id, index, false))
          )}
        </Section>
      ) : null}

      {atMax ? (
        <Hint>
          {t(
            "opportunities.studentView.rankForm.classmatesMaxReached",
            { max: maxPicks },
            { default: "You can rank up to {{max}} classmates." },
          )}
        </Hint>
      ) : null}

      {showPool ? (
        <Card variant="outline" as="section" padding={14}>
          <PoolToggle
            type="button"
            aria-expanded={poolOpen}
            onClick={() => setPoolOpen((open) => !open)}
          >
            <span>{poolToggleLabel}</span>
            <PoolToggleIcon
              $open={poolOpen}
              src="/assets/icons/builder/medium-chevron-down.svg"
              alt=""
              aria-hidden
            />
          </PoolToggle>
          {poolOpen ? (
            <PoolBody>
              <SearchInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  "opportunities.studentView.rankForm.classmatesSearch",
                  {},
                  { default: "Search classmates" },
                )}
                aria-label={t(
                  "opportunities.studentView.rankForm.classmatesSearch",
                  {},
                  { default: "Search classmates" },
                )}
              />
              {availableStudents.length > 0 ? (
                <ChipPool>
                  {availableStudents.map((student) => {
                    const name = studentDisplayName(student);
                    const addLabel = t(
                      "opportunities.studentView.rankForm.classmatesAddOne",
                      { name },
                      { default: "Add {{name}}" },
                    );
                    return (
                      <Chip
                        key={student.id}
                        variant="interactive"
                        label={name}
                        leading={<AddIcon width={18} height={18} aria-hidden />}
                        onClick={() => handleAdd(student.id)}
                        ariaLabel={addLabel}
                        title={addLabel}
                      />
                    );
                  })}
                </ChipPool>
              ) : (
                <Hint>
                  {search.trim()
                    ? t(
                        "opportunities.studentView.rankForm.classmatesSearchEmpty",
                        {},
                        { default: "No classmates match your search." },
                      )
                    : t(
                        "opportunities.studentView.rankForm.classmatesEmpty",
                        {},
                        {
                          default:
                            "Add classmates you'd like to work with. Drag to set priority (1 = first choice).",
                        },
                      )}
                </Hint>
              )}
            </PoolBody>
          ) : null}
        </Card>
      ) : null}
    </ListShell>
  );
}
