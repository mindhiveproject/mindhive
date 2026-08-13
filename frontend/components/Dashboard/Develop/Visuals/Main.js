import useTranslation from "next-translate/useTranslation";

import MessageCard from "../../../DesignSystem/MessageCard";

/**
 * Visuals bank. Deliberately empty for now — the tab exists so the section is
 * routable and admin-visible ahead of the YouQuantified visuals backend.
 */
export default function DevelopVisualsBank() {
  const { t } = useTranslation("builder");

  return (
    <MessageCard
      variant="neutral"
      message={t(
        "visualsComingSoon",
        {},
        { default: "Visuals are not available yet." }
      )}
      style={{ marginTop: "24px" }}
    />
  );
}
