import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../DesignSystem/IconButton";

const ARROW_ICON = "/assets/icons/profile/arrow.svg";
const SCROLL_EDGE_WIDTH = 56;
const SCROLL_ARROW_SIZE = 12;
const ARROW_BUTTON_SIZE = 40;
const ARROW_EDGE_PADDING = 8;

const OVERFLOW_Y_CLIP = new Set(["auto", "scroll", "hidden", "overlay"]);

function ScrollArrowIcon({ direction }) {
  return (
    <span
      className="boardColumnScrollArrowIcon"
      style={{
        display: "inline-flex",
        transform: direction === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <img
        src={ARROW_ICON}
        alt=""
        width={SCROLL_ARROW_SIZE}
        height={SCROLL_ARROW_SIZE}
        aria-hidden
      />
    </span>
  );
}

function getColumnScrollAmount(node) {
  const section = node?.querySelector(".section");
  if (!section) return 360;
  const styles = window.getComputedStyle(section);
  const margin =
    (parseFloat(styles.marginLeft) || 0) + (parseFloat(styles.marginRight) || 0);
  return section.offsetWidth + margin;
}

function clipsOverflowY(styles) {
  return OVERFLOW_Y_CLIP.has(styles.overflowY);
}

/**
 * Visible Y-range of `wrap` after clipping to overflow ancestors and the window.
 * Returns viewport coordinates { top, bottom }, or null if nothing is visible.
 */
function getVisibleYRange(wrap) {
  const wrapRect = wrap.getBoundingClientRect();
  let top = wrapRect.top;
  let bottom = wrapRect.bottom;

  let ancestor = wrap.parentElement;
  while (ancestor) {
    const styles = window.getComputedStyle(ancestor);
    if (clipsOverflowY(styles)) {
      const rect = ancestor.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
    ancestor = ancestor.parentElement;
  }

  top = Math.max(top, 0);
  bottom = Math.min(bottom, window.innerHeight);

  if (bottom <= top) return null;
  return { top, bottom, wrapTop: wrapRect.top };
}

/**
 * Midpoint of the visible slice, in wrap-local pixels for absolute
 * positioning (includes wrap.scrollTop), clamped so a 40px button stays
 * inside the visible slice (with edge padding).
 */
function getPinnedArrowTopPx(wrap) {
  const visible = getVisibleYRange(wrap);
  if (!visible) return null;

  const { top, bottom, wrapTop } = visible;
  const visibleHeight = bottom - top;
  const halfButton = ARROW_BUTTON_SIZE / 2;
  const pad = ARROW_EDGE_PADDING;

  let midViewportY;
  if (visibleHeight < ARROW_BUTTON_SIZE + pad * 2) {
    // Slice too short: pin near the top of what's visible.
    midViewportY = top + halfButton;
  } else {
    midViewportY = (top + bottom) / 2;
    const minY = top + pad + halfButton;
    const maxY = bottom - pad - halfButton;
    midViewportY = Math.min(Math.max(midViewportY, minY), maxY);
  }

  // Absolute top is relative to the wrap's padding box at scroll origin.
  return midViewportY - wrapTop + wrap.scrollTop;
}

export default function BoardColumnScroller({ children }) {
  const { t } = useTranslation("builder");
  const wrapRef = useRef(null);
  const scrollerRef = useRef(null);
  const arrowPinRafRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateArrowPin = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Edges must span the full scrollable height so abspos arrows can sit
    // anywhere along tall boards (top/bottom:0 alone only covers the scrollport).
    const edgeHeight = Math.max(wrap.scrollHeight, wrap.clientHeight);
    wrap.style.setProperty("--board-scroll-edge-height", `${edgeHeight}px`);

    const topPx = getPinnedArrowTopPx(wrap);
    if (topPx == null) {
      wrap.style.removeProperty("--board-scroll-arrow-top");
      return;
    }
    wrap.style.setProperty("--board-scroll-arrow-top", `${topPx}px`);
  }, []);

  const scheduleArrowPin = useCallback(() => {
    if (arrowPinRafRef.current != null) return;
    arrowPinRafRef.current = window.requestAnimationFrame(() => {
      arrowPinRafRef.current = null;
      updateArrowPin();
    });
  }, [updateArrowPin]);

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
      if (node.firstElementChild) {
        resizeObserver.observe(node.firstElementChild);
      }
    }

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState, children]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    updateArrowPin();

    // Capture-phase: scroll does not bubble, so ancestors (wrap, .post, etc.)
    // still notify us when the visible slice moves.
    const onScroll = () => scheduleArrowPin();
    const onResize = () => scheduleArrowPin();

    wrap.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize);

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleArrowPin);
      resizeObserver.observe(wrap);
      const scroller = scrollerRef.current;
      if (scroller) {
        resizeObserver.observe(scroller);
        if (scroller.firstElementChild) {
          resizeObserver.observe(scroller.firstElementChild);
        }
      }
    }

    return () => {
      wrap.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
      if (arrowPinRafRef.current != null) {
        window.cancelAnimationFrame(arrowPinRafRef.current);
        arrowPinRafRef.current = null;
      }
    };
  }, [updateArrowPin, scheduleArrowPin, children]);

  const scrollByDirection = (direction) => {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = getColumnScrollAmount(node);
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="boardColumnsWrap" ref={wrapRef}>
      <div
        className={clsx(
          "boardColumnScrollEdge",
          "boardColumnScrollEdgeLeft",
          !canScrollLeft && "isHidden"
        )}
      >
        <IconButton
          variant="tonal"
          style={{
            background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
            border: "1px solid var(--MH-Theme-Neutrals-Light,#e6e6e6)",
          }}
          disabled={!canScrollLeft}
          ariaLabel={t("proposal.scrollColumnsLeft", {}, {
            default: "Scroll columns left",
          })}
          onClick={() => scrollByDirection("left")}
          icon={<ScrollArrowIcon direction="left" />}
          className="boardColumnScrollArrow"
        />
      </div>

      <div className="scrollable" ref={scrollerRef}>
        {children}
      </div>

      <div
        className={clsx(
          "boardColumnScrollEdge",
          "boardColumnScrollEdgeRight",
          !canScrollRight && "isHidden"
        )}
      >
        <IconButton
          variant="tonal"
          style={{
            background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
            border: "1px solid var(--MH-Theme-Neutrals-Light,#e6e6e6)",
          }}
          disabled={!canScrollRight}
          ariaLabel={t("proposal.scrollColumnsRight", {}, {
            default: "Scroll columns right",
          })}
          onClick={() => scrollByDirection("right")}
          icon={<ScrollArrowIcon direction="right" />}
          className="boardColumnScrollArrow"
        />
      </div>
    </div>
  );
}

export { SCROLL_EDGE_WIDTH, SCROLL_ARROW_SIZE };
