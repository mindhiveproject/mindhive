import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const PoolToggleIconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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

const BAND = {
  TOP: "top",
  BACKUPS: "backups",
  REMAINING: "remaining",
};

const RANK_DND_GROUP = "classmateRankBands";

function splitRankedBands(orderedIds, topCap) {
  const cap = Math.max(0, topCap);
  return {
    top: orderedIds.slice(0, cap),
    backups: orderedIds.slice(cap),
  };
}

function applyBandDrop({
  orderedIds,
  remainingIds,
  topCap,
  destBand,
  addedIndex,
  removedIndex,
  payload,
}) {
  const id = payload?.id;
  if (!id || addedIndex == null) {
    return { orderedIds, remainingIds };
  }

  const fromBand = payload.fromBand;
  const { top, backups } = splitRankedBands(orderedIds, topCap);
  const lists = {
    [BAND.TOP]: top.slice(),
    [BAND.BACKUPS]: backups.slice(),
    [BAND.REMAINING]: remainingIds.slice(),
  };

  if (!fromBand || !Array.isArray(lists[destBand]) || !Array.isArray(lists[fromBand])) {
    return { orderedIds, remainingIds };
  }

  if (fromBand === destBand) {
    if (removedIndex == null || removedIndex === addedIndex) {
      return { orderedIds, remainingIds };
    }
    lists[destBand] = reorderArray(lists[destBand], removedIndex, addedIndex);
  } else {
    lists[fromBand] = lists[fromBand].filter((itemId) => itemId !== id);
    const dest = lists[destBand].filter((itemId) => itemId !== id);
    const idx = Math.max(0, Math.min(addedIndex, dest.length));
    dest.splice(idx, 0, id);
    lists[destBand] = dest;
  }

  const cap = Math.max(0, topCap);
  while (lists[BAND.TOP].length > cap) {
    lists[BAND.BACKUPS].unshift(lists[BAND.TOP].pop());
  }

  return {
    orderedIds: [...lists[BAND.TOP], ...lists[BAND.BACKUPS]],
    remainingIds: lists[BAND.REMAINING],
  };
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
  const [remainingIds, setRemainingIds] = useState([]);
  const orderedIdsRef = useRef(orderedIds);
  const remainingIdsRef = useRef(remainingIds);

  const topCap = effectivePicks > 0 ? effectivePicks : 0;

  useEffect(() => {
    setOrderedIds(classmateOrder);
  }, [classmateOrder]);

  useEffect(() => {
    const ranked = new Set(classmateOrder);
    const available = (students || [])
      .map((s) => s?.id)
      .filter((id) => id && !ranked.has(id));
    setRemainingIds((prev) => {
      const kept = prev.filter((id) => available.includes(id));
      const incoming = available.filter((id) => !kept.includes(id));
      return [...kept, ...incoming];
    });
  }, [students, classmateOrder]);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students || []) {
      if (s?.id) map.set(s.id, s);
    }
    return map;
  }, [students]);

  const knownOrderedIds = useMemo(
    () => (orderedIds || []).filter((id) => studentById.has(id)),
    [orderedIds, studentById],
  );

  const knownRemainingIds = useMemo(
    () => remainingIds.filter((id) => studentById.has(id)),
    [remainingIds, studentById],
  );

  orderedIdsRef.current = knownOrderedIds;
  remainingIdsRef.current = knownRemainingIds;

  const { top: topIds, backups: backupIds } = splitRankedBands(
    knownOrderedIds,
    topCap,
  );

  const visibleRemainingIds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return knownRemainingIds.filter((id) => {
      if (!query) return true;
      const student = studentById.get(id);
      if (!student) return false;
      return studentDisplayName(student).toLowerCase().includes(query);
    });
  }, [knownRemainingIds, search, studentById]);

  const showRemaining = (students?.length || 0) > 0;

  const commitOrder = useCallback(
    (nextOrdered, nextRemaining) => {
      setOrderedIds(nextOrdered);
      if (Array.isArray(nextRemaining)) setRemainingIds(nextRemaining);
      onClassmateOrderChange(nextOrdered);
    },
    [onClassmateOrderChange],
  );

  const handleAdd = (studentId) => {
    if (!studentId || !rankingEnabled) return;
    const nextRemaining = knownRemainingIds.filter((id) => id !== studentId);
    const nextOrdered = knownOrderedIds.includes(studentId)
      ? knownOrderedIds
      : topIds.length < topCap
        ? [...topIds, studentId, ...backupIds]
        : [...topIds, ...backupIds, studentId];
    commitOrder(nextOrdered, nextRemaining);
  };

  const handleRemove = (studentId) => {
    if (!rankingEnabled) return;
    const nextOrdered = knownOrderedIds.filter((id) => id !== studentId);
    const nextRemaining = knownRemainingIds.includes(studentId)
      ? knownRemainingIds
      : [...knownRemainingIds, studentId];
    commitOrder(nextOrdered, nextRemaining);
  };

  const handleBandDrop = useCallback(
    (destBand) =>
      ({ removedIndex, addedIndex, payload }) => {
        if (!rankingEnabled) return;
        if (addedIndex == null) return;
        const result = applyBandDrop({
          orderedIds: orderedIdsRef.current,
          remainingIds: remainingIdsRef.current,
          topCap,
          destBand,
          addedIndex,
          removedIndex,
          payload,
        });
        commitOrder(result.orderedIds, result.remainingIds);
      },
    [commitOrder, rankingEnabled, topCap],
  );

  const dragHint = t("opportunities.studentView.rankForm.dragHint", {}, {
    default: "Drag to reorder",
  });

  const handleRemainingDrop = useCallback(
    ({ removedIndex, addedIndex, payload }) => {
      if (!rankingEnabled || addedIndex == null) return;
      const remaining = remainingIdsRef.current;

      const mapVisibleIndex = (visibleIndex) => {
        if (visibleIndex == null) return null;
        if (visibleIndex >= visibleRemainingIds.length) {
          return remaining.length;
        }
        const targetId = visibleRemainingIds[visibleIndex];
        const idx = remaining.indexOf(targetId);
        return idx < 0 ? remaining.length : idx;
      };

      const result = applyBandDrop({
        orderedIds: orderedIdsRef.current,
        remainingIds: remaining,
        topCap,
        destBand: BAND.REMAINING,
        addedIndex: mapVisibleIndex(addedIndex),
        removedIndex:
          payload?.fromBand === BAND.REMAINING
            ? mapVisibleIndex(removedIndex)
            : removedIndex,
        payload,
      });
      commitOrder(result.orderedIds, result.remainingIds);
    },
    [commitOrder, rankingEnabled, topCap, visibleRemainingIds],
  );

  const renderRow = (studentId, { rank, isActivePick, showRemove, wrapDraggable }) => {
    const student = studentById.get(studentId);
    if (!student) return null;
    const name = studentDisplayName(student);
    const removeLabel = t(
      "opportunities.studentView.rankForm.classmatesRemove",
      { name },
      { default: "Remove {{name}}" },
    );
    const addLabel = t(
      "opportunities.studentView.rankForm.classmatesAddOne",
      { name },
      { default: "Add {{name}}" },
    );

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
        {rank != null ? (
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
        ) : (
          <span aria-hidden />
        )}
        <StudentName title={name}>{name}</StudentName>
        {rankingEnabled && showRemove ? (
          <IconButton
            variant="subtle"
            ariaLabel={removeLabel}
            title={removeLabel}
            onClick={() => handleRemove(studentId)}
            icon={<CloseIcon width={18} height={18} aria-hidden />}
          />
        ) : null}
        {rankingEnabled && !showRemove ? (
          <IconButton
            variant="subtle"
            ariaLabel={addLabel}
            title={addLabel}
            onClick={() => handleAdd(studentId)}
            icon={<AddIcon width={18} height={18} aria-hidden />}
          />
        ) : null}
      </RankRow>
    );

    if (wrapDraggable) {
      return <Draggable key={studentId}>{row}</Draggable>;
    }
    return <div key={studentId}>{row}</div>;
  };

  const renderDropList = (ids, band, getRank, isActive) => {
    const onDrop =
      band === BAND.REMAINING ? handleRemainingDrop : handleBandDrop(band);
    const payloadIds =
      band === BAND.REMAINING ? visibleRemainingIds : ids;

    if (!rankingEnabled) {
      return (
        <RankListContainer>
          {ids.map((id, index) =>
            renderRow(id, {
              rank: getRank(index),
              isActivePick: isActive(index),
              showRemove: band !== BAND.REMAINING,
              wrapDraggable: false,
            }),
          )}
        </RankListContainer>
      );
    }

    return (
      <RankListContainer>
        <Container
          groupName={RANK_DND_GROUP}
          dragHandleSelector=".classmate-drag-handle"
          lockAxis="y"
          onDrop={onDrop}
          getChildPayload={(index) => ({
            id: payloadIds[index],
            fromBand: band,
          })}
        >
          {ids.map((id, index) =>
            renderRow(id, {
              rank: getRank(index),
              isActivePick: isActive(index),
              showRemove: band !== BAND.REMAINING,
              wrapDraggable: true,
            }),
          )}
        </Container>
      </RankListContainer>
    );
  };

  const remainingToggleLabel = t(
    "opportunities.studentView.rankForm.classmatesRemaining",
    {},
    { default: "Add a classmate" },
  );

  const hasClassmates = (students?.length || 0) > 0;

  return (
    <ListShell>
      {hasClassmates ? (
        <Section>
          <SectionLabel>
            {t(
              "opportunities.studentView.rankForm.classmatesTopPicks",
              { count: topCap },
              {
                default:
                  "Your top {{count}} picks",
              },
            )}
          </SectionLabel>
          {topIds.length > 0
            ? renderDropList(
                topIds,
                BAND.TOP,
                (index) => index + 1,
                () => topCap > 0,
              )
            : (
              <>
                {rankingEnabled
                  ? renderDropList(topIds, BAND.TOP, () => null, () => false)
                  : null}
                <Hint>
                  {t("opportunities.studentView.rankForm.classmatesTopEmpty", {}, {
                    default: "Drag classmates here for your top picks.",
                  })}
                </Hint>
              </>
            )}
        </Section>
      ) : null}

      {hasClassmates ? (
        <Section>
          <SectionLabel>
            {t("opportunities.studentView.rankForm.classmatesBackups", {}, {
              default: "Backups",
            })}
          </SectionLabel>
          <ZoneLabel>
            {t("opportunities.studentView.rankForm.classmatesBackupsHelper", {}, {
              default: "Used only if your top picks don't work out.",
            })}
          </ZoneLabel>
          {backupIds.length > 0
            ? renderDropList(
                backupIds,
                BAND.BACKUPS,
                (index) => topIds.length + index + 1,
                () => false,
              )
            : (
              <>
                {rankingEnabled
                  ? renderDropList(
                      backupIds,
                      BAND.BACKUPS,
                      () => null,
                      () => false,
                    )
                  : null}
                <Hint>
                  {t(
                    "opportunities.studentView.rankForm.classmatesBackupsEmpty",
                    {},
                    { default: "Drag classmates here as backups." },
                  )}
                </Hint>
              </>
            )}
        </Section>
      ) : null}

      {showRemaining ? (
        <Card variant="outline" as="section" padding={14}>
          <PoolToggle
            type="button"
            aria-expanded={poolOpen}
            onClick={() => setPoolOpen((open) => !open)}
          >
            <PoolToggleIconContainer>
              <AddIcon width={18} height={18} aria-hidden />
              <span>{remainingToggleLabel}</span>
            </PoolToggleIconContainer>
            <PoolToggleIcon
              $open={poolOpen}
              src="/assets/icons/builder/medium-chevron-down.svg"
              alt=""
              aria-hidden
            />
          </PoolToggle>
          {poolOpen ? (
            <PoolBody>
              <ZoneLabel>
                {t(
                  "opportunities.studentView.rankForm.classmatesRemainingHelper",
                  {},
                  {
                    default:
                      "Classmates not in your top picks or backups. Drag someone up to rank them.",
                  },
                )}
              </ZoneLabel>
              <SearchInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  "opportunities.studentView.rankForm.classmatesSearch",
                  {},
                  { default: "Add a classmate — search by name" },
                )}
                aria-label={t(
                  "opportunities.studentView.rankForm.classmatesSearch",
                  {},
                  { default: "Add a classmate — search by name" },
                )}
              />
              {visibleRemainingIds.length > 0 || rankingEnabled
                ? renderDropList(
                    visibleRemainingIds,
                    BAND.REMAINING,
                    () => null,
                    () => false,
                  )
                : null}
              {visibleRemainingIds.length === 0 ? (
                <Hint>
                  {search.trim()
                    ? t(
                        "opportunities.studentView.rankForm.classmatesSearchEmpty",
                        {},
                        { default: "No classmates match your search." },
                      )
                    : t(
                        "opportunities.studentView.rankForm.classmatesRemainingNone",
                        {},
                        {
                          default:
                            "All classmates are in your top picks or backups.",
                        },
                      )}
                </Hint>
              ) : null}
            </PoolBody>
          ) : null}
        </Card>
      ) : null}
    </ListShell>
  );
}
