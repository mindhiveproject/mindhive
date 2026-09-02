import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import { DragIndicatorIcon } from "../../../../DesignSystem/Icons";
import PanelHeader from "../../../../DesignSystem/PanelHeader";
import Popover from "../../../../DesignSystem/Popover";
import {
  getOpportunityThumbnailSources,
  hasOpportunityPlayableVideo,
} from "../../../../../lib/opportunityVideoEmbed";
import {
  formatOpportunityMentorLabel,
  formatOpportunitySponsorLabel,
  getOpportunityMentors,
  getOpportunitySponsors,
  isMentorTbd,
} from "../../../../../lib/opportunityPeople";
import OpportunityIntroVideoModal from "./OpportunityIntroVideoModal";

const ListShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .smooth-dnd-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 4px;
  }
`;

const RankRow = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  min-width: 0;

  &.unavailable {
    opacity: 0.72;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  @media (max-width: 820px) {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    align-items: center;

    .rankRowNote {
      grid-column: 2 / 3;
      grid-row: 2;
    }

    .rankRowVideo {
      grid-column: 4;
      grid-row: 1;
    }
  }
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

const RankBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 999px;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  flex-shrink: 0;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const OppMain = styled.div`
  min-width: 0;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  min-width: 0;
`;

const NotePopoverBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;

  .hint {
    margin: 0;
    font: var(--MH-Type-Body-Base, 400 13px/18px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const VideoThumbButton = styled.button`
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--MH-Theme-Neutrals-Medium, #e6e6e6);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .playOverlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.28);
    pointer-events: none;
  }

  .playIcon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

    &::after {
      content: "";
      display: block;
      width: 0;
      height: 0;
      margin-left: 2px;
      border-style: solid;
      border-width: 5px 0 5px 8px;
      border-color: transparent transparent transparent
        var(--MH-Theme-Neutrals-Black, #171717);
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const OppText = styled.div`
  min-width: 0;

  .title {
    margin: 0;
    font: var(--MH-Type-Title-Small, 600 16px/22px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    margin: 2px 0 0;
    font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const NoteField = styled.textarea`
  width: 100%;
  min-height: 40px;
  max-height: 160px;
  padding: 8px 10px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #d3dae0);
  border-radius: 8px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base, 400 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  &:disabled {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const UnavailableNote = styled.p`
  margin: 4px 0 0;
  grid-column: 1 / -1;
  font: var(--MH-Type-Body-Base, 400 13px/18px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Danger-Dark, #8f1f14);
`;

function reorderArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

function sponsorsIncludeAllMentors(opportunity) {
  const mentors = getOpportunityMentors(opportunity);
  if (!mentors.length) return false;
  const sponsorIds = new Set(
    getOpportunitySponsors(opportunity).map((profile) => String(profile.id)),
  );
  return mentors.every((mentor) => sponsorIds.has(String(mentor.id)));
}

function isSponsorAlsoMentor(opportunity) {
  if (isMentorTbd(opportunity)) return false;
  return (
    opportunity?.sponsorIsMentor === true || sponsorsIncludeAllMentors(opportunity)
  );
}

function buildInitialOrder(opportunities, rankings) {
  return [...opportunities]
    .sort((a, b) => {
      const rankA = rankings[a.id]?.rank;
      const rankB = rankings[b.id]?.rank;
      const numA =
        rankA !== "" && rankA !== undefined && rankA !== null
          ? Number(rankA)
          : null;
      const numB =
        rankB !== "" && rankB !== undefined && rankB !== null
          ? Number(rankB)
          : null;
      if (numA != null && numB != null) return numA - numB;
      if (numA != null) return -1;
      if (numB != null) return 1;
      return (a.title || "").localeCompare(b.title || "");
    })
    .map((opp) => opp.id);
}

function primeVideoThumbnail(event) {
  const video = event.currentTarget;
  if (!video?.duration || Number.isNaN(video.duration)) return;
  const targetTime = Math.min(0.5, video.duration * 0.05);
  if (video.currentTime < targetTime) {
    video.currentTime = targetTime;
  }
}

function VideoThumbMedia({ coverUrl, directVideoSrc, embedThumbUrl }) {
  if (coverUrl) {
    return <img src={coverUrl} alt="" />;
  }
  if (directVideoSrc) {
    const src = directVideoSrc.includes("#")
      ? directVideoSrc
      : `${directVideoSrc}#t=0.1`;
    return (
      <video
        src={src}
        preload="metadata"
        muted
        playsInline
        onLoadedMetadata={primeVideoThumbnail}
      />
    );
  }
  if (embedThumbUrl) {
    return <img src={embedThumbUrl} alt="" />;
  }
  return null;
}

function OpportunityPeopleMeta({ opportunity, t }) {
  const sponsorLine = formatOpportunitySponsorLabel(opportunity);
  const mentorLine = formatOpportunityMentorLabel(opportunity, t);
  const sponsorIsAlsoMentor = isSponsorAlsoMentor(opportunity);
  const sponsorIsMentorLabel = t(
    "opportunities.preview.sponsorIsMentor",
    {},
    { default: "Sponsor is mentor" },
  );
  const sponsorRoleLabel = t(
    "opportunities.studentView.meta.sponsorRole",
    {},
    { default: "Sponsor" },
  );
  const mentorRoleLabel = t(
    "opportunities.studentView.meta.mentorRole",
    {},
    { default: "Mentor" },
  );

  return (
    <>
      {sponsorLine !== "—" ? (
        <MetaRow>
          <Chip variant="static" tone="neutral" label={sponsorLine} />
          <p className="meta">
            {sponsorIsAlsoMentor ? sponsorIsMentorLabel : sponsorRoleLabel}
          </p>
        </MetaRow>
      ) : null}
      {!sponsorIsAlsoMentor ? (
        isMentorTbd(opportunity) ? (
          <p className="meta">{mentorLine}</p>
        ) : (
          <MetaRow>
            <Chip variant="static" tone="neutral" label={mentorLine} />
            <p className="meta">{mentorRoleLabel}</p>
          </MetaRow>
        )
      ) : null}
    </>
  );
}

function RankNoteButton({
  value,
  onChange,
  disabled,
  opportunity,
  t,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const noteButtonLabel = t(
    "opportunities.studentView.rankForm.noteButton",
    {},
    { default: "Leave a note" },
  );
  const notePopoverTitle = t(
    "opportunities.studentView.rankForm.notePopoverTitle",
    {},
    { default: "Note for your teacher" },
  );
  const noteSharedHint = t(
    "opportunities.studentView.rankForm.noteSharedWithTeacher",
    {},
    { default: "This note is shared with your teacher." },
  );
  const closeLabel = t(
    "opportunities.studentView.rankForm.notePopoverClose",
    {},
    { default: "Close" },
  );
  const notePlaceholder = t(
    "opportunities.studentView.rankForm.privateNotePlaceholder",
    {},
    { default: "Add a note for your teacher…" },
  );
  const noteAriaLabel = t(
    "opportunities.studentView.rankForm.privateNoteLabel",
    { title: opportunity.title || "" },
    { default: "Private note for {{title}}" },
  );

  return (
    <>
      <span ref={anchorRef} className="rankRowNote">
        <Button
          type="button"
          variant="subtle"
          disabled={disabled}
          aria-label={noteAriaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((prev) => !prev)}
        >
          {noteButtonLabel}
        </Button>
      </span>

      <Popover
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        side="bottom"
        align="end"
        width={320}
        ariaLabel={notePopoverTitle}
      >
        <PanelHeader
          title={notePopoverTitle}
          onClose={() => setOpen(false)}
          closeLabel={closeLabel}
        />
        <NotePopoverBody>
          <p className="hint">{noteSharedHint}</p>
          <NoteField
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={notePlaceholder}
            disabled={disabled}
            aria-label={noteAriaLabel}
          />
        </NotePopoverBody>
      </Popover>
    </>
  );
}

function RankRowItem({
  opportunity,
  rank,
  ranking,
  rankingEnabled,
  onCommentChange,
  onOpenVideo,
  unavailableMessage,
  t,
}) {
  const hasVideo = hasOpportunityPlayableVideo(opportunity);
  const { coverUrl, directVideoSrc, embedThumbUrl } =
    getOpportunityThumbnailSources(opportunity);
  const rankLabel = t(
    "opportunities.studentView.rankForm.rankBadge",
    { rank },
    { default: "Rank {{rank}}" },
  );
  const watchVideoLabel = t(
    "opportunities.studentView.rankForm.watchVideo",
    { title: opportunity.title || "" },
    { default: "Watch intro video for {{title}}" },
  );

  return (
    <RankRow className={clsx({ unavailable: !rankingEnabled })}>
      <DragHandle
        className="rank-drag-handle"
        aria-disabled={!rankingEnabled}
        title={t("opportunities.studentView.rankForm.dragHint", {}, {
          default: "Drag to reorder",
        })}
      >
        <DragIndicatorIcon />
      </DragHandle>

      <RankBadge aria-label={rankLabel}>{rank}</RankBadge>

      <OppMain>
        <OppText>
          <p className="title" title={opportunity.title}>
            {opportunity.title}
          </p>
          <OpportunityPeopleMeta opportunity={opportunity} t={t} />
        </OppText>
      </OppMain>

      <RankNoteButton
        value={ranking?.comment || ""}
        onChange={onCommentChange}
        disabled={!rankingEnabled}
        opportunity={opportunity}
        t={t}
      />

      {hasVideo ? (
        <VideoThumbButton
          className="rankRowVideo"
          type="button"
          onClick={() => onOpenVideo(opportunity)}
          aria-label={watchVideoLabel}
        >
          <VideoThumbMedia
            coverUrl={coverUrl}
            directVideoSrc={directVideoSrc}
            embedThumbUrl={embedThumbUrl}
          />
          <span className="playOverlay" aria-hidden>
            <span className="playIcon" />
          </span>
        </VideoThumbButton>
      ) : null}

      {unavailableMessage ? (
        <UnavailableNote>{unavailableMessage}</UnavailableNote>
      ) : null}
    </RankRow>
  );
}

/**
 * Drag-and-drop ranked list of favorited opportunities for student preference submission.
 */
export default function FavoriteRankList({
  opportunities,
  rankings,
  onRankingsChange,
  rankingEnabled,
  syncKey = "",
  now = Date.now(),
}) {
  const { t } = useTranslation("classes");
  const [orderedIds, setOrderedIds] = useState([]);
  const [videoModalOpp, setVideoModalOpp] = useState(null);

  const opportunityById = useMemo(() => {
    const map = new Map();
    for (const opp of opportunities) {
      if (opp?.id) map.set(opp.id, opp);
    }
    return map;
  }, [opportunities]);

  useEffect(() => {
    const order = buildInitialOrder(opportunities, rankings);
    setOrderedIds(order);
    onRankingsChange((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((id) => {
        if (!order.includes(id)) {
          delete next[id];
          changed = true;
        }
      });
      order.forEach((id, idx) => {
        const expectedRank = idx + 1;
        if (next[id]?.rank !== expectedRank) {
          next[id] = { ...(next[id] || {}), rank: expectedRank };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  const applyOrderToRankings = useCallback(
    (ids) => {
      onRankingsChange((prev) => {
        const next = { ...prev };
        ids.forEach((id, idx) => {
          next[id] = { ...(next[id] || {}), rank: idx + 1 };
        });
        return next;
      });
    },
    [onRankingsChange],
  );

  const handleDrop = useCallback(
    ({ removedIndex, addedIndex }) => {
      if (!rankingEnabled) return;
      if (removedIndex == null || addedIndex == null) return;
      if (removedIndex === addedIndex) return;
      setOrderedIds((prev) => {
        const next = reorderArray(prev, removedIndex, addedIndex);
        applyOrderToRankings(next);
        return next;
      });
    },
    [applyOrderToRankings, rankingEnabled],
  );

  const updateField = useCallback(
    (oppId, key, value) => {
      onRankingsChange((prev) => ({
        ...prev,
        [oppId]: { ...(prev[oppId] || {}), [key]: value },
      }));
    },
    [onRankingsChange],
  );

  const getUnavailableMessage = (opp) => {
    const availableToMs = opp.availableTo
      ? new Date(opp.availableTo).getTime()
      : null;
    const availableFromMs = opp.availableFrom
      ? new Date(opp.availableFrom).getTime()
      : null;
    const oppExpired = availableToMs && availableToMs < now;
    const oppNotYetAvailable = availableFromMs && availableFromMs > now;
    if (oppExpired) {
      return t(
        "opportunities.studentView.rankForm.expired",
        { date: new Date(opp.availableTo).toLocaleDateString() },
        {
          default:
            "This opportunity ended on {{date}}. You can no longer rank it.",
        },
      );
    }
    if (oppNotYetAvailable) {
      return t(
        "opportunities.studentView.rankForm.notYetAvailable",
        { date: new Date(opp.availableFrom).toLocaleDateString() },
        {
          default:
            "This opportunity starts on {{date}}. Ranking unlocks once it's available.",
        },
      );
    }
    return null;
  };

  if (orderedIds.length === 0) {
    return null;
  }

  const renderRow = (oppId, index, wrapDraggable) => {
    const opp = opportunityById.get(oppId);
    if (!opp) return null;
    const rank = index + 1;
    const ranking = rankings[oppId] || {};
    const unavailableMessage = getUnavailableMessage(opp);
    const oppAvailable = !unavailableMessage;
    const rowEnabled = rankingEnabled && oppAvailable;
    const row = (
      <RankRowItem
        opportunity={opp}
        rank={rank}
        ranking={ranking}
        rankingEnabled={rowEnabled}
        unavailableMessage={unavailableMessage}
        onCommentChange={(value) => updateField(oppId, "comment", value)}
        onOpenVideo={setVideoModalOpp}
        t={t}
      />
    );
    if (wrapDraggable) {
      return <Draggable key={oppId}>{row}</Draggable>;
    }
    return <div key={oppId}>{row}</div>;
  };

  return (
    <>
      <ListShell>
        {rankingEnabled ? (
          <Container
            dragHandleSelector=".rank-drag-handle"
            lockAxis="y"
            onDrop={handleDrop}
          >
            {orderedIds.map((oppId, index) => renderRow(oppId, index, true))}
          </Container>
        ) : (
          orderedIds.map((oppId, index) => renderRow(oppId, index, false))
        )}
      </ListShell>

      <OpportunityIntroVideoModal
        open={Boolean(videoModalOpp)}
        onClose={() => setVideoModalOpp(null)}
        opportunity={videoModalOpp}
      />
    </>
  );
}
