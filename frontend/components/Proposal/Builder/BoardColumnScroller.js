import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../DesignSystem/IconButton";

const ARROW_ICON = "/assets/icons/profile/arrow.svg";
const SCROLL_EDGE_WIDTH = 56;
const SCROLL_ARROW_SIZE = 12;

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

export default function BoardColumnScroller({ children }) {
  const { t } = useTranslation("builder");
  const scrollerRef = useRef(null);
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
    <div className="boardColumnsWrap">
      <div
        className={clsx(
          "boardColumnScrollEdge",
          "boardColumnScrollEdgeLeft",
          !canScrollLeft && "isHidden"
        )}
      >
        <IconButton
          variant="tonal"
          style={{background:"var(--MH-Theme-Neutrals-White, #FFFFFF)", border:"1px solid var(--MH-Theme-Neutrals-Light,#e6e6e6)"}}
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
          style={{background:"var(--MH-Theme-Neutrals-White, #FFFFFF)", border:"1px solid var(--MH-Theme-Neutrals-Light,#e6e6e6)"}}
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
