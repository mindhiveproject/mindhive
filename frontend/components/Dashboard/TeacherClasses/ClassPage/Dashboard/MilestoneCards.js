import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../../../DesignSystem/IconButton";
import { ProjectBoardIcon, MilestoneIcon } from "../../../../DesignSystem/Icons";
import DashboardAssetIcon from "./DashboardAssetIcon";
import { DASHBOARD_PROJECTS_CARD_KEY } from "./dashboardUtils";

const ARROW_ICON = "/assets/icons/profile/arrow.svg";
const SCROLL_AMOUNT = 240;
const SCROLL_EDGE_WIDTH = 56;
const SCROLL_ARROW_SIZE = 12;
const SCROLL_ARROW_BUTTON_STYLE = {
  width: "36px",
  height: "36px",
  padding: "6px",
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  border: "1.5px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  color: "var(--MH-Theme-Accent-Dark, #5D5763)",
};

function ScrollArrowIcon({ direction }) {
  return (
    <span
      className="milestoneScrollArrowIcon"
      style={{
        display: "inline-flex",
        transform: direction === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <DashboardAssetIcon src={ARROW_ICON} size={SCROLL_ARROW_SIZE} />
    </span>
  );
}

export default function MilestoneCards({
  milestones = [],
  selectedKey,
  onSelect,
  completionByKey = {},
  totalStudents = 0,
  projectsAssignedCount = 0,
}) {
  const { t } = useTranslation("classes");
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const projectsSelected =
    !selectedKey || selectedKey === DASHBOARD_PROJECTS_CARD_KEY;

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && node.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return undefined;

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(node);
    }

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState, milestones.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const key = selectedKey || DASHBOARD_PROJECTS_CARD_KEY;
    const frame = window.requestAnimationFrame(() => {
      const target = scroller.querySelector(
        `[data-milestone-key="${CSS.escape(key)}"]`
      );
      if (!target) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const edgePad = SCROLL_EDGE_WIDTH;
      const fullyVisible =
        targetRect.left >= scrollerRect.left + edgePad &&
        targetRect.right <= scrollerRect.right - edgePad;
      if (fullyVisible) {
        updateScrollState();
        return;
      }

      const nextLeft = Math.max(
        0,
        target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2
      );
      scroller.scrollTo({ left: nextLeft, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedKey, milestones, updateScrollState]);

  const scrollByDirection = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  return (
    <StyledMilestoneCardsWrap>
      <div
        className={clsx(
          "milestoneScrollEdge",
          "milestoneScrollEdgeLeft",
          !canScrollLeft && "isHidden"
        )}
      >
        <IconButton
          variant="outline"
          elevated={false}
          disabled={!canScrollLeft}
          ariaLabel={t("dashboard.scrollMilestonesLeft", {}, {
            default: "Scroll milestones left",
          })}
          onClick={() => scrollByDirection("left")}
          icon={<ScrollArrowIcon direction="left" />}
          className="milestoneScrollArrow"
          style={SCROLL_ARROW_BUTTON_STYLE}
        />
      </div>

      <StyledMilestoneCards
        ref={scrollerRef}
        role="tablist"
        aria-label={t("dashboard.milestoneCardsNav", {}, {
          default: "Class milestones",
        })}
      >
        <button
          type="button"
          role="tab"
          data-milestone-key={DASHBOARD_PROJECTS_CARD_KEY}
          aria-selected={projectsSelected}
          className={clsx("milestoneCard", projectsSelected && "isSelected")}
          onClick={() => onSelect?.(DASHBOARD_PROJECTS_CARD_KEY)}
        >
          <div className="milestoneCardHeader">
            <ProjectBoardIcon />
            <span className="milestoneCardTitle">
              {t("dashboard.projectsCardTitle", {}, { default: "Projects" })}
            </span>
          </div>
          <p className="milestoneCardCount">
            {t(
              "dashboard.projectsAssignedCount",
              { assigned: projectsAssignedCount, total: totalStudents },
              { default: "{{assigned}} / {{total}} with a project" }
            )}
          </p>
        </button>

        {milestones.map((milestone) => {
          const selected = milestone.key === selectedKey;
          const completed = completionByKey[milestone.key] || 0;
          return (
            <button
              key={milestone.id || milestone.key}
              type="button"
              role="tab"
              data-milestone-key={milestone.key}
              aria-selected={selected}
              className={clsx("milestoneCard", selected && "isSelected")}
              onClick={() => onSelect?.(milestone.key)}
            >
              <div className="milestoneCardHeader">
                <MilestoneIcon />
                <span className="milestoneCardTitle">
                  {milestone.title || milestone.key}
                </span>
              </div>
              <p className="milestoneCardCount">
                {t(
                  "dashboard.completedCount",
                  { completed, total: totalStudents },
                  { default: "{{completed}} / {{total}} completed" }
                )}
              </p>
            </button>
          );
        })}
      </StyledMilestoneCards>

      <div
        className={clsx(
          "milestoneScrollEdge",
          "milestoneScrollEdgeRight",
          !canScrollRight && "isHidden"
        )}
      >
        <IconButton
          variant="outline"
          elevated={false}
          disabled={!canScrollRight}
          ariaLabel={t("dashboard.scrollMilestonesRight", {}, {
            default: "Scroll milestones right",
          })}
          onClick={() => scrollByDirection("right")}
          icon={<ScrollArrowIcon direction="right" />}
          className="milestoneScrollArrow"
          style={SCROLL_ARROW_BUTTON_STYLE}
        />
      </div>
    </StyledMilestoneCardsWrap>
  );
}

const StyledMilestoneCardsWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  .milestoneScrollEdge {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    width: ${SCROLL_EDGE_WIDTH}px;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }

  .milestoneScrollEdgeLeft {
    left: 0;
    justify-content: flex-start;
    padding-left: 2px;
    background: linear-gradient(
      to right,
      var(--MH-Theme-Neutrals-Light-Green, #f6f9f8) 0%,
      var(--MH-Theme-Neutrals-Light-Green, #f6f9f8) 42%,
      rgba(246, 249, 248, 0) 100%
    );
  }

  .milestoneScrollEdgeRight {
    right: 0;
    justify-content: flex-end;
    padding-right: 2px;
    background: linear-gradient(
      to left,
      var(--MH-Theme-Neutrals-Light-Green, #f6f9f8) 0%,
      var(--MH-Theme-Neutrals-Light-Green, #f6f9f8) 42%,
      rgba(246, 249, 248, 0) 100%
    );
  }

  .milestoneScrollEdge.isHidden {
    opacity: 0;
    visibility: hidden;
  }

  .milestoneScrollArrow {
    pointer-events: auto;
  }

  .milestoneScrollArrow .DesignSystem-IconButton-Icon {
    width: ${SCROLL_ARROW_SIZE}px !important;
    height: ${SCROLL_ARROW_SIZE}px !important;
  }

  .milestoneScrollArrow .DesignSystem-IconButton-Icon img {
    width: ${SCROLL_ARROW_SIZE}px;
    height: ${SCROLL_ARROW_SIZE}px;
    opacity: 0.55;
  }
`;

const StyledMilestoneCards = styled.div`
  display: flex;
  gap: 12px;
  /* flex-basis 0 forces this track to shrink to the wrap width so cards
     overflow inside here instead of expanding the page horizontally. */
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  padding: 2px 4px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior-x: contain;

  &::-webkit-scrollbar {
    display: none;
  }

  .milestoneCard {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 0 0 200px;
    width: 200px;
    min-width: 200px;
    max-width: 200px;
    margin: 0;
    padding: 16px;
    border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;

    &:hover {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    }

    &:focus-visible {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 2px;
    }

    &.isSelected {
      border: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      background: var(--MH-Theme-Primary-Light, #def8fb);
    }
  }

  .milestoneCardHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    svg {
      flex-shrink: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }
  }

  .milestoneCardTitle {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
  }

  .milestoneCardCount {
    margin: 0;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;
