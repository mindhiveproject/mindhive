import Link from "next/link";
import styled, { css } from "styled-components";

/**
 * Shared Connect entity card (Figma 506:1306 horizontal person card,
 * 519:875 horizontal organization card).
 *
 * Avatar, title, subtitle, one chip and the action buttons — no long-form
 * description. `layout` switches between the wide horizontal card and a
 * narrower vertical one so both can be tried on the browse pages.
 */

const MAX_WIDTH = {
  horizontal: "484px",
  vertical: "320px",
};

const CardContainer = styled.article`
  display: flex;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  box-sizing: border-box;
  max-width: ${({ $layout }) => MAX_WIDTH[$layout]};

  /* The dashboard fades every link and button on hover; the card states below
     and the design system buttons say it properly, so opt out of that here. */
  a:hover,
  button:hover {
    opacity: 1;
  }

  ${({ $layout }) =>
    $layout === "vertical"
      ? css`
          flex-direction: column;
          align-items: center;
          text-align: center;
        `
      : css`
          align-items: center;
          justify-content: space-between;
        `}
`;

const infoClusterStyles = css`
  display: flex;
  min-width: 0;
  text-decoration: none;
  color: inherit;

  ${({ $layout }) =>
    $layout === "vertical"
      ? css`
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        `
      : css`
          align-items: flex-start;
          gap: 16px;
          flex: 1;
        `}
`;

const InfoClusterLink = styled(Link)`
  ${infoClusterStyles}
  cursor: pointer;

  &:hover .name span {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const InfoClusterStatic = styled.div`
  ${infoClusterStyles}
`;

const Avatar = styled.div`
  width: 86px;
  height: 86px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 32px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  align-items: ${({ $layout }) =>
    $layout === "vertical" ? "center" : "flex-start"};

  ${({ $layout }) =>
    $layout === "vertical"
      ? css`
          width: 100%;
        `
      : css`
          flex: 1;
        `}
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  .name {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    word-break: break-word;
  }

  .subtitle {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    word-break: break-word;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
`;

/**
 * @param {"horizontal"|"vertical"} [layout="horizontal"] - Card shape. Horizontal
 *   caps at 484px, vertical stacks the avatar above the text and caps at 320px.
 * @param {{ src?: string, fallbackLabel?: string, fallbackBackground?: string }} [avatar]
 * @param {React.ReactNode} title - Primary line (name).
 * @param {React.ReactNode} [titleAdornment] - Rendered next to the title (e.g. verified badge).
 * @param {React.ReactNode} [subtitle] - Secondary line (occupation, location).
 * @param {React.ReactNode} [chip] - Single chip under the title.
 * @param {React.ReactNode} [actions] - Icon buttons on the trailing edge.
 * @param {string|object} [href] - When set, the avatar/text cluster links here.
 * @param {string} [ariaLabel] - Accessible name for that link.
 */
export default function ConnectCard({
  layout = "horizontal",
  avatar,
  title,
  titleAdornment = null,
  subtitle = null,
  chip = null,
  actions = null,
  href = null,
  ariaLabel,
}) {
  const InfoCluster = href ? InfoClusterLink : InfoClusterStatic;

  return (
    <CardContainer $layout={layout}>
      <InfoCluster
        $layout={layout}
        {...(href ? { href, "aria-label": ariaLabel } : {})}
      >
        <Avatar>
          {avatar?.src ? (
            <img src={avatar.src} alt="" />
          ) : (
            <div
              className="fallback"
              style={
                avatar?.fallbackBackground
                  ? { background: avatar.fallbackBackground }
                  : undefined
              }
              aria-hidden
            >
              {avatar?.fallbackLabel}
            </div>
          )}
        </Avatar>

        <TextColumn $layout={layout}>
          <NameBlock>
            <div className="name">
              <span>{title}</span>
              {titleAdornment}
            </div>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </NameBlock>

          {chip}
        </TextColumn>
      </InfoCluster>

      {actions && <Actions>{actions}</Actions>}
    </CardContainer>
  );
}
