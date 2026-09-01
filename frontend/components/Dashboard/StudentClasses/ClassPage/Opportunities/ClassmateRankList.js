import { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import { AddIcon, CloseIcon, DragIndicatorIcon } from "../../../../DesignSystem/Icons";
import {
  deriveClassmateOrder,
  studentDisplayName,
} from "../../../../../lib/connectBallotUtils";

export { studentDisplayName, deriveClassmateOrder };

const ROW_GAP_PX = 10;
const ACTIVE_ELEVATION =
  "var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1))";

const ListShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow: visible;

  .smooth-dnd-container {
    display: flex;
    flex-direction: column;
    gap: ${ROW_GAP_PX}px;
    min-height: 4px;
    padding: 0;
    overflow: visible;
  }

  /* smooth-dnd sets overflow:hidden on vertical wrappers — clips row elevation */
  .smooth-dnd-container.vertical > .smooth-dnd-draggable-wrapper,
  .smooth-dnd-draggable-wrapper.vertical {
    overflow: visible !important;
    box-sizing: border-box;
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: visible;
`;

const SectionLabel = styled.h3`
  margin: 0;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const ZoneLabel = styled.p`
  margin: 0 0 8px;
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const RankListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
`;

const RankRow = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  min-width: 0;
  box-sizing: border-box;
  position: relative;

  ${({ $active }) =>
    $active
      ? `
    box-shadow: ${ACTIVE_ELEVATION};
  `
      : ""}
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

export default function ClassmateRankList({
  students,
  classmateOrder,
  onClassmateOrderChange,
  effectivePicks = 0,
  rankingEnabled = true,
}) {
  const { t } = useTranslation("classes");
  const [search, setSearch] = useState("");
  const [poolOpen, setPoolOpen] = useState(true);
  const [orderedIds, setOrderedIds] = useState(classmateOrder);

  useEffect(() => {
    setOrderedIds(classmateOrder);
  }, [classmateOrder]);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students || []) {
      if (s?.id) map.set(s.id, s);
    }
    return map;
  }, [students]);

  const activeCount = Math.min(
    effectivePicks > 0 ? effectivePicks : 0,
    orderedIds.length,
  );

  const availableStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (students || []).filter((s) => {
      if (!s?.id || orderedIds.includes(s.id)) return false;
      if (!query) return true;
      return studentDisplayName(s).toLowerCase().includes(query);
    });
  }, [students, orderedIds, search]);

  const showPool =
    rankingEnabled && (students?.length || 0) > orderedIds.length;

  const handleAdd = (studentId) => {
    if (!studentId || !rankingEnabled) return;
    const next = [...orderedIds, studentId];
    setOrderedIds(next);
    onClassmateOrderChange(next);
  };

  const handleRemove = (studentId) => {
    if (!rankingEnabled) return;
    const next = orderedIds.filter((id) => id !== studentId);
    setOrderedIds(next);
    onClassmateOrderChange(next);
  };

  const handleDrop = useCallback(
    ({ removedIndex, addedIndex }) => {
      if (!rankingEnabled) return;
      if (removedIndex == null || addedIndex == null) return;
      if (removedIndex === addedIndex) return;
      setOrderedIds((prev) => {
        const next = reorderArray(prev, removedIndex, addedIndex);
        onClassmateOrderChange(next);
        return next;
      });
    },
    [onClassmateOrderChange, rankingEnabled],
  );

  const dragHint = t("opportunities.studentView.rankForm.dragHint", {}, {
    default: "Drag to reorder",
  });

  const activeZoneLabel =
    effectivePicks > 0
      ? t(
          "opportunities.studentView.rankForm.classmatesActiveZoneLabel",
          { count: effectivePicks },
          {
            default:
              "Your top {{count}} highlighted picks count toward team matching (order does not matter)",
          },
        )
      : null;

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

    const isActivePick = effectivePicks > 0 && index < activeCount;

    const row = (
      <RankRow
        data-rank-row
        data-active-row={isActivePick ? "true" : undefined}
        $active={isActivePick}
      >
        <DragHandle
          className="classmate-drag-handle"
          aria-disabled={!rankingEnabled}
          title={dragHint}
        >
          <DragIndicatorIcon />
        </DragHandle>
        <Chip
          variant="static"
          tone={isActivePick ? "info" : "neutral"}
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
      {orderedIds.length > 0 ? (
        <Section>
          <SectionLabel>
            {t("opportunities.studentView.rankForm.classmatesRanked", {}, {
              default: "Your ranked classmates",
            })}
          </SectionLabel>
          {activeZoneLabel && activeCount > 0 ? (
            <ZoneLabel>{activeZoneLabel}</ZoneLabel>
          ) : null}
          {rankingEnabled ? (
            <RankListContainer>
              <Container
                dragHandleSelector=".classmate-drag-handle"
                lockAxis="y"
                onDrop={handleDrop}
              >
                {orderedIds.map((id, index) => renderRow(id, index, true))}
              </Container>
            </RankListContainer>
          ) : (
            <RankListContainer>
              {orderedIds.map((id, index) => renderRow(id, index, false))}
            </RankListContainer>
          )}
        </Section>
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
