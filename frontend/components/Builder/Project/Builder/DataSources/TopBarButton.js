"use client";

import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Tooltip from "../../../../DesignSystem/Tooltip";
import { WaveformIcon } from "../../../../DesignSystem/Icons";

/**
 * The entry to the study's external data sources, in the canvas top bar next
 * to "Add a comment". What it covers and which sources are linked show in its
 * tooltip; it opens the link-a-source modal, where each source's settings are
 * also reached.
 */
export default function DataSourcesTopBarButton({ sources, onOpenLink }) {
  const { t } = useTranslation("builder");

  const summary =
    sources.length === 0
      ? t("dataSources.panelEmpty", {}, {
          default: "No data sources linked to this study yet.",
        })
      : t(
          "dataSources.linkedList",
          {
            names: sources
              .map((source) => source.label || source.block?.title)
              .filter(Boolean)
              .join(", "),
          },
          { default: "Linked: {{names}}" }
        );
  const tooltip = `${t("dataSources.panelSubtitle", {}, {
    default: "This study collects data from external devices",
  })}\n${summary}`;

  return (
    <Tooltip content={tooltip} side="bottom">
      <Button
        id="dataSourcesButton"
        type="button"
        variant="filled"
        tone="primary"
        onClick={onOpenLink}
        leadingIcon={<WaveformIcon style={{ width: "20px", height: "20px" }} />}
      >
        {t("dataSources.topBarButton", {}, { default: "External datasource" })}
      </Button>
    </Tooltip>
  );
}
