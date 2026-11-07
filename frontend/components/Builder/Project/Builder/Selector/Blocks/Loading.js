import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

// Placeholder cards shown in the "Add a block" panel while its block list is
// being fetched. Shaped like the block cards so the list doesn't jump when the
// real cards arrive.
export default function BlocksLoading({ count = 4 }) {
  const { t } = useTranslation("builder");
  const label = t("selector.loadingBlocks", {}, { default: "Loading blocks…" });

  return (
    <StyledBlocksLoading role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeletonCard" key={i} aria-hidden="true">
          <div className="skeletonAccent" />
          <div className="skeletonBody">
            <div className="skeletonLine" style={{ width: `${60 + ((i * 17) % 30)}%` }} />
            <div className="skeletonActions">
              <span />
              <span />
              <span />
              <span className="skeletonAdd" />
            </div>
          </div>
        </div>
      ))}
      <span className="srOnly">{label}</span>
    </StyledBlocksLoading>
  );
}

const StyledBlocksLoading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @keyframes blocksLoadingPulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }

  .skeletonCard {
    display: flex;
    min-height: 72px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    overflow: hidden;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }

  .skeletonAccent {
    width: 8px;
    flex-shrink: 0;
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  .skeletonBody {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    min-width: 0;
  }

  .skeletonLine,
  .skeletonActions span,
  .skeletonAccent {
    animation: blocksLoadingPulse 1.4s ease-in-out infinite;
  }

  .skeletonLine {
    flex: 1;
    height: 16px;
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  .skeletonActions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    span {
      width: 40px;
      height: 40px;
      border-radius: 100px;
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    }

    .skeletonAdd {
      background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }
  }

  .srOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .skeletonLine,
    .skeletonActions span,
    .skeletonAccent {
      animation: none;
    }
  }
`;
