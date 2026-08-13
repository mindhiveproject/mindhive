import Link from "next/link";
import styled, { css } from "styled-components";

/**
 * Shared Connect entity card (Figma 506:1306), used for both people and
 * organizations: avatar, name, subtitle and tag chips stacked centre-aligned,
 * a two-line description, then a divider and the trailing actions.
 */

const CardContainer = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  max-width: 368px;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);

  /* The card is a static surface: the buttons in it are the affordances, so it
     has no hover state of its own. The dashboard fades every link and button on
     hover, which would undo that, so opt out of it here. */
  a:hover,
  button:hover {
    opacity: 1;
  }
`;

const TypeLabel = styled.p`
  margin: 0;
  align-self: flex-start;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const infoClusterStyles = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
  text-decoration: none;
  color: inherit;
`;

const InfoClusterLink = styled(Link)`
  ${infoClusterStyles}
  cursor: pointer;

  /* No hover styling by design — see CardContainer. The pointer cursor still
     signals the shortcut, and focus-visible stays for keyboard users. */
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
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  text-align: center;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 100%;

  .name {
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

const Chips = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;

  /* Chips hug their label. One too long for the card wraps onto another line
     rather than being clipped, so no org name is ever cut off. Chip pins its
     label with an inline flex-shrink: 0, which is what this undoes; the
     matching height: auto comes from the call sites, since Chip's 32px height
     is inline too. */
  .DesignSystem-Chip > span:last-child {
    flex-shrink: 1 !important;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const Description = styled.p`
  margin: 0;
  width: 100%;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Divider = styled.hr`
  /* Auto top margin keeps the action row on the baseline of the grid row, so
     cards with a short description do not float their buttons mid-card. */
  margin: auto 0 0;
  width: 100%;
  height: 0;
  border: none;
  border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
`;

/**
 * @param {React.ReactNode} [typeLabel] - Quiet eyebrow in the top-left naming
 *   what kind of entity this is ("Profile", "Organization"), so a card is
 *   legible on its own outside the browse page that grouped it.
 * @param {{ src?: string, fallbackLabel?: string, fallbackBackground?: string }} [avatar]
 * @param {React.ReactNode} title - Primary line (name).
 * @param {React.ReactNode} [subtitle] - Secondary line (occupation, location).
 * @param {React.ReactNode} [status] - Standing of the entity (e.g. verified),
 *   on its own line under the name rather than crowding the title.
 * @param {React.ReactNode} [chips] - Tag chips stacked under the name.
 * @param {React.ReactNode} [description] - Two-line summary under the chips.
 * @param {React.ReactNode} [actions] - Buttons below the divider, trailing-aligned.
 * @param {string|object} [href] - When set, the avatar/text cluster links here.
 * @param {string} [ariaLabel] - Accessible name for that link.
 */
export default function ConnectCard({
  typeLabel = null,
  avatar,
  title,
  subtitle = null,
  status = null,
  chips = null,
  description = null,
  actions = null,
  href = null,
  ariaLabel,
}) {
  const InfoCluster = href ? InfoClusterLink : InfoClusterStatic;

  return (
    <CardContainer>
      {typeLabel && <TypeLabel>{typeLabel}</TypeLabel>}
      <InfoCluster {...(href ? { href, "aria-label": ariaLabel } : {})}>
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

        <TextColumn>
          <NameBlock>
            <div className="name">
              <span>{title}</span>
            </div>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </NameBlock>

          {status}

          {chips && <Chips>{chips}</Chips>}
        </TextColumn>
      </InfoCluster>

      {description && <Description>{description}</Description>}

      {actions && (
        <>
          <Divider />
          <Actions>{actions}</Actions>
        </>
      )}
    </CardContainer>
  );
}
