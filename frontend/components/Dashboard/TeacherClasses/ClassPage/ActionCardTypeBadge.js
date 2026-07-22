import useTranslation from "next-translate/useTranslation";

import {
  getActionCardTypeBadgeStyle,
  getActionCardTypeLabel,
} from "../../../../lib/templateBoardActionCards";

const BADGE_STYLE = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 100,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "16px",
  verticalAlign: "baseline",
};

export default function ActionCardTypeBadge({ card, style = {} }) {
  const { t } = useTranslation("classes");
  const label = getActionCardTypeLabel(card, t);

  return (
    <span style={{ ...BADGE_STYLE, ...getActionCardTypeBadgeStyle(card), ...style }}>
      {label}
    </span>
  );
}
