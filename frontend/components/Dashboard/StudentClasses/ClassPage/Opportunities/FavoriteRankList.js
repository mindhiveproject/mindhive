import { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Draggable } from "react-smooth-dnd";
import useTranslation from "next-translate/useTranslation";
import clsx from "clsx";
import styled from "styled-components";

import { StarFilledIcon, StarIcon } from "../../../../DesignSystem/Icons";
import {
  getOpportunityThumbnailSources,
  hasOpportunityPlayableVideo,
} from "../../../../../lib/opportunityVideoEmbed";
import {
  formatOpportunityMentorLabel,
  formatOpportunitySponsorLabel,
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
  grid-template-columns: auto auto minmax(0, 1fr) auto minmax(160px, 1.2fr);
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
    grid-template-columns: auto auto minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    align-items: start;

    .rankRowStars {
      grid-column: 2 / -1;
    }

    .rankRowNote {
      grid-column: 1 / -1;
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
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
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

const StarRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

const StarButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--MH-Theme-Neutrals-Medium, #d3dae0);

  &.filled {
    color: #f5b800;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 1px;
    border-radius: 4px;
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

function mentorDisplayName(mentor) {
  if (!mentor) return null;
  const full = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");
  return full || mentor.username || null;
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

function FiveStarRating({ value, onChange, disabled, labelPrefix }) {
  const stars = value === "" || value == null ? 0 : Number(value);

  return (
    <StarRow className="rankRowStars" role="group" aria-label={labelPrefix}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= stars;
        const starLabel = `${labelPrefix} ${n}`;
        return (
          <StarButton
            key={n}
            type="button"
            className={clsx({ filled })}
            disabled={disabled}
            aria-label={starLabel}
            aria-pressed={filled}
            onClick={() => onChange(stars === n ? "" : n)}
          >
            {filled ? (
              <StarFilledIcon width={22} height={22} aria-hidden />
            ) : (
              <StarIcon width={22} height={22} aria-hidden />
            )}
          </StarButton>
        );
      })}
    </StarRow>
  );
}

function RankRowItem({
  opportunity,
  rank,
  ranking,
  rankingEnabled,
  onStarChange,
  onCommentChange,
  onOpenVideo,
  unavailableMessage,
  t,
}) {
  const hasVideo = hasOpportunityPlayableVideo(opportunity);
  const { coverUrl, directVideoSrc, embedThumbUrl } =
    getOpportunityThumbnailSources(opportunity);
  const sponsorLine = formatOpportunitySponsorLabel(opportunity);
  const mentorLine = formatOpportunityMentorLabel(opportunity, t);
  const rankLabel = t(
    "opportunities.studentView.rankForm.rankBadge",
    { rank },
    { default: "Rank {{rank}}" },
  );
  const starsLabel = t(
    "opportunities.studentView.rankForm.starRatingLabel",
    { title: opportunity.title || "" },
    { default: "Star rating for {{title}}" },
  );
  const notePlaceholder = t(
    "opportunities.studentView.rankForm.privateNotePlaceholder",
    {},
    { default: "Private note for your teacher…" },
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
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <circle cx="4" cy="3" r="1.25" fill="currentColor" />
          <circle cx="10" cy="3" r="1.25" fill="currentColor" />
          <circle cx="4" cy="7" r="1.25" fill="currentColor" />
          <circle cx="10" cy="7" r="1.25" fill="currentColor" />
          <circle cx="4" cy="11" r="1.25" fill="currentColor" />
          <circle cx="10" cy="11" r="1.25" fill="currentColor" />
        </svg>
      </DragHandle>

      <RankBadge aria-label={rankLabel}>{rank}</RankBadge>

      <OppMain>
        {hasVideo ? (
          <VideoThumbButton
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
        <OppText>
          <p className="title" title={opportunity.title}>
            {opportunity.title}
          </p>
          {sponsorLine !== "—" ? (
            <p className="meta">
              {t(
                "opportunities.studentView.meta.sponsor",
                { name: sponsorLine },
                { default: "Sponsor: {{name}}" },
              )}
            </p>
          ) : null}
          <p className="meta">
            {t(
              "opportunities.studentView.meta.mentor",
              { name: mentorLine },
              { default: "Mentor: {{name}}" },
            )}
          </p>
        </OppText>
      </OppMain>

      <FiveStarRating
        value={ranking?.starRating ?? ""}
        onChange={onStarChange}
        disabled={!rankingEnabled}
        labelPrefix={starsLabel}
      />

      <NoteField
        className="rankRowNote"
        value={ranking?.comment || ""}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder={notePlaceholder}
        disabled={!rankingEnabled}
        aria-label={t(
          "opportunities.studentView.rankForm.privateNoteLabel",
          { title: opportunity.title || "" },
          { default: "Private note for {{title}}" },
        )}
      />

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
        onStarChange={(value) => updateField(oppId, "starRating", value)}
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
