import styled from "styled-components";

const imgBackground = "/assets/connect/background.svg";

export const FALLBACK_COLORS = [
  "#DEF8FB",
  "#FDF2D0",
  "#EDCECD",
  "#D8D3E7",
  "#D3E2F1",
  "#D3E0E3",
];

export const PRONOUNS_LABELS = {
  he: "he/him/his",
  she: "she/her/hers",
  they: "they/them/theirs",
};

export function getGradientForProfile(profileKey) {
  if (!profileKey) {
    return FALLBACK_COLORS[0];
  }

  let hash = 0;
  for (let i = 0; i < profileKey.length; i += 1) {
    hash = (hash << 5) - hash + profileKey.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}

export const ConnectShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
  margin: 0px;
  background-color: #f7f9f8;
  background-image: url(${imgBackground});
  background-repeat: repeat;
  background-position: center top;
  background-attachment: fixed;
  background-size: auto;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  @media (max-width: 1024px) {
    padding: 32px 24px 48px;
  }
`;

export const ProfileShell = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 24px 64px;
`;

export const ProfileCard = styled.div`
  width: 100%;
  max-width: 1104px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0px 4px 75px rgba(0, 0, 0, 0.1);
  padding: 48px clamp(24px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  min-width: 0;
`;

export const NameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;

  .h1 {
    font-family: "Inter", sans-serif;
    font-size: 46px;
    font-weight: 700;
    line-height: 52px;
    color: #171717;
    margin: 0;
  }
`;

export const PronounTag = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  background: #edf2ee;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
`;

export const Tagline = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #171717;
`;

export const ContactInfoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

export const Avatar = styled.div`
  width: 116px;
  height: 116px;
  border-radius: 50%;
  border: 4px solid #434343;
  overflow: hidden;
  background: #d3e0e3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: "Lato", sans-serif;
  font-size: 40px;
  color: #1d1b20;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-family: "Lato", sans-serif;
    color: #1d1b20;
  }
`;

export const AvatarEditOverlay = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);

  i.icon {
    margin: 0 !important;
  }
`;

export const FavoriteButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MetaItem = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;

  i.icon {
    color: #171717;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    vertical-align: middle !important;
    flex-shrink: 0;
  }

  a,
  span {
    display: inline-flex;
    align-items: center;
    line-height: 20px;
  }

  a {
    color: #171717;
    text-decoration: none;
  }
`;

export const ConnectActions = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
`;

export const CardDivider = styled.div`
  width: 100%;
  height: 2px;
  background: #edf2ee;
`;

export const ContentColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1.5fr);
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  justify-content: flex-end;
  font-family: "Lato", sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #171717;
`;

export const BodyCopy = styled.p`
  margin: 0;
  font-family: "Lato", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #2a343d;
  white-space: pre-line;
`;

export const ChipContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
`;

export const ChipList = styled.div`
  display: flex;
  flex-direction: wrap;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
`;

export const InterestTag = styled.span`
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
  width: fit-content;
  min-width: fit-content;
  min-height: 32px;
  height: fit-content;
  max-height: 64px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f3f3f3;
  color: #171717;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 20px;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #171717;

  input,
  textarea,
  select {
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: #171717;
    border: 1px solid #a1a1a1;
    border-radius: 8px;
    padding: 10px 12px;
    background: #ffffff;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  &.fullWidth {
    grid-column: 1 / -1;
  }
`;
