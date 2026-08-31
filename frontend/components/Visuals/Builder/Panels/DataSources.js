"use client";

import useTranslation from "next-translate/useTranslation";

import Panel from "../Panel";
import Card, { CardSection } from "../../../DesignSystem/Card";
import Chip from "../../../DesignSystem/Chip";
import { WaveformIcon } from "../../../DesignSystem/Icons";

const EMPTY_STYLE = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: 8,
  padding: "32px 24px",
};

const ICON_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "var(--MH-Theme-Primary-Lighter, #F4F8F7)",
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
  marginBottom: 8,
};

const TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BODY_STYLE = {
  margin: 0,
  maxWidth: 380,
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const CHIPS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 8,
  marginTop: 8,
};

/**
 * Placeholder for the Data Source tab.
 *
 * The device and processing layer lives in the separate `yq-data` package and
 * isn't wired up yet, so rather than showing a broken catalog this names what is
 * coming. The chips are the receivers yq-data already implements or has a clear
 * path to — they set expectations without promising a date.
 */
export default function DataSourcesPanel() {
  const { t } = useTranslation("visuals");

  return (
    <Panel title={t("dataSource", "Data Source")}>
      <Card>
        <CardSection style={EMPTY_STYLE}>
          <span style={ICON_STYLE}>
            <WaveformIcon />
          </span>
          <h3 style={TITLE_STYLE}>
            {t("dataSourcesComing", "We're building this")}
          </h3>
          <p style={BODY_STYLE}>
            {t(
              "dataSourcesComingBody",
              "Data sources will let you connect a device and stream its outputs into this visual's parameters. Until then, parameters can be driven by hand from the Parameters tab."
            )}
          </p>
          <div style={CHIPS_STYLE}>
            {["Muse", "EMOTIV", "Camera", "Microphone", "LSL", "File replay"].map(
              (label) => (
                <Chip key={label} label={label} disabled />
              )
            )}
          </div>
        </CardSection>
      </Card>
    </Panel>
  );
}
