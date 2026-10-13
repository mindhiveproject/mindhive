import { useState } from "react";
import { useQuery } from "@apollo/client";
import { FEATURED_STUDIES } from "../Queries/Study";

import FeaturedCard from "./FeaturedCard";
import IconButton from "../DesignSystem/IconButton";
import { StyledFeaturedStudies } from "../styles/StyledFeatured";
import useTranslation from "next-translate/useTranslation";

const ARROW_ICON = "/assets/icons/profile/arrow.svg";
const ARROW_ICON_SIZE = 12;

// Same white, hairline-bordered arrow as the project board column scroller.
const ARROW_BUTTON_STYLE = {
  background: "var(--MH-Theme-Neutrals-White, #ffffff)",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
};

function ArrowIcon({ direction }) {
  return (
    <span
      style={{
        display: "inline-flex",
        transform: direction === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <img
        src={ARROW_ICON}
        alt=""
        width={ARROW_ICON_SIZE}
        height={ARROW_ICON_SIZE}
        aria-hidden
      />
    </span>
  );
}

function DisplayFeatured({ user, studies, isDashboard }) {
  const { t } = useTranslation("common");
  const [index, setIndex] = useState(0);

  const total = studies.length;
  const current = Math.min(index, total - 1);
  const study = studies[current];
  const hasMany = total > 1;

  // Wraps around at both ends.
  const step = (delta) => setIndex((i) => (i + delta + total) % total);

  // Arrow keys page through the carousel while either control has focus.
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  };

  const position = t(
    "featuredCarousel.position",
    { current: current + 1, total },
    { default: `${current + 1} of ${total}` }
  );

  return (
    <StyledFeaturedStudies>
      <section
        className="featuredCarousel"
        aria-roledescription="carousel"
        aria-label={t(
          "featuredCarousel.label",
          {},
          { default: "Featured studies" }
        )}
      >
        <div
          className="featuredContainer"
          role="group"
          aria-roledescription="slide"
          aria-label={position}
          aria-live="polite"
        >
          <FeaturedCard
            key={study?.id}
            user={user}
            study={study}
            isDashboard={isDashboard}
          />
        </div>

        {hasMany && (
          <div className="featuredControls">
            <IconButton
              variant="tonal"
              style={ARROW_BUTTON_STYLE}
              ariaLabel={t(
                "featuredCarousel.previous",
                {},
                { default: "Previous featured study" }
              )}
              onClick={() => step(-1)}
              onKeyDown={onKeyDown}
              icon={<ArrowIcon direction="left" />}
            />
            <span className="featuredPosition" aria-hidden>
              {current + 1} / {total}
            </span>
            <IconButton
              variant="tonal"
              style={ARROW_BUTTON_STYLE}
              ariaLabel={t(
                "featuredCarousel.next",
                {},
                { default: "Next featured study" }
              )}
              onClick={() => step(1)}
              onKeyDown={onKeyDown}
              icon={<ArrowIcon direction="right" />}
            />
          </div>
        )}
      </section>
    </StyledFeaturedStudies>
  );
}

export default function FeaturedStudies({ user, isDashboard }) {
  const { data, error, loading } = useQuery(FEATURED_STUDIES);
  const studies = data?.studies || [];

  if (studies?.length) {
    return (
      <DisplayFeatured
        user={user}
        studies={studies}
        isDashboard={isDashboard}
      />
    );
  }
}
