import { useCallback, useEffect, useRef, useState } from "react";

// Space kept above a section when jumping to it, and the line a section's top
// must cross to count as the one being read.
const ACTIVE_OFFSET = 96;

function getScrollParent(node) {
  let el = node?.parentElement;
  while (el && el !== document.body) {
    const { overflowY } = window.getComputedStyle(el);
    if (/(auto|scroll)/.test(overflowY) && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return window;
}

// Minimal "on this page" rail for the Settings tab: lists the sections,
// highlights the one in view and scrolls to a section on click.
export default function SettingsSectionNav({ sections, ariaLabel }) {
  const navRef = useRef(null);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);
  // After a click, keep the clicked item lit until the user scrolls by hand:
  // a section near the bottom can't reach the top, so position alone would
  // light a later one.
  const lockedIdRef = useRef(null);

  const sectionIds = sections.map((section) => section.id).join("|");

  useEffect(() => {
    const scroller = getScrollParent(navRef.current);
    const scrollTarget = scroller === window ? window : scroller;
    let frame = null;

    const update = () => {
      frame = null;
      if (lockedIdRef.current) return;
      const ids = sectionIds ? sectionIds.split("|") : [];
      const containerTop =
        scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const atBottom =
        scroller === window
          ? window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2
          : scroller.scrollTop + scroller.clientHeight >=
            scroller.scrollHeight - 2;

      let current = ids[0] ?? null;
      if (atBottom && ids.length) {
        current = ids[ids.length - 1];
      } else {
        ids.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          if (el.getBoundingClientRect().top - containerTop <= ACTIVE_OFFSET) {
            current = id;
          }
        });
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame == null) frame = window.requestAnimationFrame(update);
    };

    const onUserScroll = () => {
      if (!lockedIdRef.current) return;
      lockedIdRef.current = null;
      onScroll();
    };

    update();
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
    window.addEventListener("keydown", onUserScroll);
    return () => {
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onUserScroll);
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, [sectionIds]);

  const goTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    lockedIdRef.current = id;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav ref={navRef} className="settingsSectionNav" aria-label={ariaLabel}>
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={section.id === activeId ? "active" : undefined}
              aria-current={section.id === activeId ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                goTo(section.id);
              }}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
