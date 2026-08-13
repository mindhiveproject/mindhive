import Link from "next/link";
import styled, { css } from "styled-components";

/**
 * Horizontal counterpart to ConnectCard, for detail panels holding two entities
 * rather than a grid of many. The vertical browse card leaves most of a 900px
 * panel empty and implies a comparison that is not being made.
 *
 * `density="regular"` is the emphasised band — 86px avatar, description, and its
 * own action row under a divider, keeping ConnectCard's bottom grouping.
 * `density="compact"` is the quieter one, with a 48px logo, no description and
 * the actions inline, so a supporting entity does not read as a peer.
 */

const AVATAR_SIZE = { regular: "86px", compact: "48px" };

const BandContainer = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);

  /* The dashboard fades every link and button on hover; the states below and
     the design system buttons say it properly, so opt out of that here. */
  a:hover,
  button:hover {
    opacity: 1;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
`;

const infoClusterStyles = css`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
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
  width: ${({ $density }) => AVATAR_SIZE[$density]};
  height: ${({ $density }) => AVATAR_SIZE[$density]};
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
    font-size: ${({ $density }) => ($density === "compact" ? "20px" : "32px")};
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;

  .name {
    margin: 0;
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
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;

  /* Same reasoning as ConnectCard: Chip pins its label with an inline
     flex-shrink: 0, so a long label would push the band instead of wrapping. */
  .DesignSystem-Chip > span:last-child {
    flex-shrink: 1 !important;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const Description = styled.p`
  margin: 0;
  max-width: 640px;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const Divider = styled.hr`
  margin: 0;
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
  flex-shrink: 0;
  flex-wrap: wrap;
`;

const BottomActions = styled(Actions)`
  width: 100%;
`;

/**
 * @param {{ src?: string, fallbackLabel?: string, fallbackBackground?: string }} [avatar]
 * @param {React.ReactNode} title - Primary line (name).
 * @param {React.ReactNode} [subtitle] - Secondary line (occupation, location).
 * @param {React.ReactNode} [status] - Standing of the entity (e.g. verified).
 * @param {React.ReactNode} [chips] - Tag chips, wrapping inline.
 * @param {React.ReactNode} [description] - Two-line summary; regular density only.
 * @param {React.ReactNode} [actions] - Buttons; below a divider at regular
 *   density, inline on the trailing edge at compact.
 * @param {string|object} [href] - When set, the avatar/text cluster links here.
 * @param {string} [ariaLabel] - Accessible name for that link.
 * @param {"regular"|"compact"} [density="regular"]
 */
export default function ConnectEntityBand({
  avatar,
  title,
  subtitle = null,
  status = null,
  chips = null,
  description = null,
  actions = null,
  href = null,
  ariaLabel,
  density = "regular",
}) {
  const compact = density === "compact";
  const InfoCluster = href ? InfoClusterLink : InfoClusterStatic;

  return (
    <BandContainer>
      <Row>
        <InfoCluster {...(href ? { href, "aria-label": ariaLabel } : {})}>
          <Avatar $density={density}>
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

            {!compact && description && <Description>{description}</Description>}
          </TextColumn>
        </InfoCluster>

        {compact && actions && <Actions>{actions}</Actions>}
      </Row>

      {!compact && actions && (
        <>
          <Divider />
          <BottomActions>{actions}</BottomActions>
        </>
      )}
    </BandContainer>
  );
}
