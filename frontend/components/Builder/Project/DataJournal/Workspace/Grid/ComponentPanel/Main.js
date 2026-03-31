// components/DataJournal/Workspace/Grid/ComponentPanel/Main.js
import { StyledComponentPanel } from "../../../styles/StyledDataJournal"; // Adjust path
import useTranslation from "next-translate/useTranslation";
import InfoTooltip from "../../../../../../DesignSystem/InfoTooltip";
import CompactActionButton from "../../../../../../DesignSystem/CompactActionButton";

import { templates } from "../../../Widgets/types/Graph/Editor/TemplateSelector"; // Adjust path to Templates
import { testTemplates } from "../../../Widgets/types/StatisticalTests/Editor/TempateSelector";
import { summaryTemplates } from "../../../Widgets/types/Statistics/Editor/TempateSelector";
import { codeTemplates } from "../../../Widgets/types/Code/Editor/TempateSelector";
import { hypvisTemplates } from "../../../Widgets/types/HypVis/Editor/TemplateSelector";

export default function ComponentPanel({ handleAddComponent, onClose }) {
  const { t } = useTranslation("dataviz");
  const componentSections = [
    {
      sectionTitleKey: "dataJournal.components.sections.graphs",
      sectionTitleFallback: "Graphs & Visuals",
      cards: [
        {
          id: "bar-chart",
          imageSrc: "/assets/dataviz/componentPanel/barChart.svg",
          titleKey: "dataJournal.components.items.barChart",
          titleFallback: "Bar Chart",
          descriptionKey: "dataJournal.components.descriptions.barChart",
          descriptionFallback: "Compare values across categories with grouped bars.",
          createPayload: () => ({
            title: t("dataJournal.components.items.barGraph", "Bar Graph"),
            type: "GRAPH",
            content: { type: "barGraph", code: templates?.barGraph },
          }),
        },
        {
          id: "scatter-plot",
          imageSrc: "/assets/dataviz/componentPanel/scatterPlot.svg",
          titleKey: "dataJournal.components.items.scatterPlot",
          titleFallback: "Scatter Plot",
          descriptionKey: "dataJournal.components.descriptions.scatterPlot",
          descriptionFallback:
            "Visualize relationships and patterns between two variables.",
          createPayload: () => ({
            title: t("dataJournal.components.items.scatterPlot", "Scatter Plot"),
            type: "GRAPH",
            content: { type: "scatterPlot", code: templates?.scatterPlot },
          }),
        },
        {
          id: "histogram",
          imageSrc: "/assets/dataviz/componentPanel/histogram.svg",
          titleKey: "dataJournal.components.items.histogram",
          titleFallback: "Histogram",
          descriptionKey: "dataJournal.components.descriptions.histogram",
          descriptionFallback:
            "Show the distribution of values across numeric buckets.",
          createPayload: () => ({
            title: t("dataJournal.components.items.histogram", "Histogram"),
            type: "GRAPH",
            content: { type: "histogram", code: templates?.histogram },
          }),
        },
        {
          id: "code-from-scratch",
          imageSrc: "/assets/dataviz/componentPanel/code.svg",
          titleKey: "dataJournal.components.items.codeFromScratch",
          titleFallback: "Code from scratch",
          descriptionKey: "dataJournal.components.descriptions.codeFromScratch",
          descriptionFallback:
            "Write custom code to build fully tailored analyses or visuals.",
          createPayload: () => ({
            title: t(
              "dataJournal.components.items.codeFromScratch",
              "Code from scratch"
            ),
            type: "CODE",
            content: { type: "code", code: codeTemplates?.plainCode },
          }),
        },
        {
          id: "text-block",
          imageSrc: "/assets/dataviz/componentPanel/textBlock.svg",
          titleKey: "dataJournal.components.items.textBlock",
          titleFallback: "Text Block",
          descriptionKey: "dataJournal.components.descriptions.textBlock",
          descriptionFallback:
            "Add notes, interpretation, and context to your journal.",
          createPayload: () => ({
            title: t("dataJournal.components.items.textBlock", "Text Block"),
            type: "PARAGRAPH",
            content: { text: "" },
          }),
        },
      ],
    },
    {
      sectionTitleKey: "dataJournal.components.sections.hypothesisVisualizer",
      sectionTitleFallback: "Hypothesis Visualizer",
      cards: [
        {
          id: "experimental-hypothesis",
          imageSrc: "/assets/dataviz/componentPanel/abDesign.svg",
          titleKey: "dataJournal.components.items.experimentalHypothesis",
          titleFallback: "Experimental Hypothesis",
          descriptionKey:
            "dataJournal.components.descriptions.experimentalHypothesis",
          descriptionFallback:
            "Plan controlled A/B style experiments and compare outcomes.",
          createPayload: () => ({
            title: t(
              "dataJournal.components.items.experimentalHypothesis",
              "Experimental Hypothesis"
            ),
            type: "HYPVIS",
            content: { type: "abDesign", code: hypvisTemplates?.abDesign },
          }),
        },
        {
          id: "correlational-hypothesis",
          imageSrc: "/assets/dataviz/componentPanel/correlationStudy.svg",
          titleKey: "dataJournal.components.items.correlationalHypothesis",
          titleFallback: "Correlational Hypothesis",
          descriptionKey:
            "dataJournal.components.descriptions.correlationalHypothesis",
          descriptionFallback:
            "Investigate how variables move together without intervention.",
          createPayload: () => ({
            title: t(
              "dataJournal.components.items.correlationalHypothesis",
              "Correlational Hypothesis"
            ),
            type: "HYPVIS",
            content: { type: "corStudy", code: hypvisTemplates?.corStudy },
          }),
        },
      ],
    },
    {
      sectionTitleKey: "dataJournal.components.sections.statisticalTests",
      sectionTitleFallback: "Statistical Tests",
      cards: [
        {
          id: "pearson-correlation",
          imageSrc: "/assets/dataviz/componentPanel/pearsonCorr.svg",
          titleKey: "dataJournal.components.items.pearsonCorrelation",
          titleFallback: "Pearson Correlation",
          descriptionKey: "dataJournal.components.descriptions.pearsonCorrelation",
          descriptionFallback:
            "Measure linear association strength between two variables.",
          createPayload: () => ({
            title: t(
              "dataJournal.components.items.pearsonCorrelation",
              "Pearson Correlation"
            ),
            type: "STATTEST",
            content: { type: "pearsonCorr", code: testTemplates?.pearsonCorr },
          }),
        },
        {
          id: "t-test",
          imageSrc: "/assets/dataviz/componentPanel/tTest.svg",
          titleKey: "dataJournal.components.items.tTest",
          titleFallback: "T-Test",
          descriptionKey: "dataJournal.components.descriptions.tTest",
          descriptionFallback:
            "Compare means between two groups and test significance.",
          createPayload: () => ({
            title: t("dataJournal.components.items.tTest", "T-Test"),
            type: "STATTEST",
            content: { type: "tTest", code: testTemplates?.tTest },
          }),
        },
        {
          id: "one-way-anova",
          imageSrc: "/assets/dataviz/componentPanel/oneWayAnova.svg",
          titleKey: "dataJournal.components.items.oneWayAnova",
          titleFallback: "One Way Anova",
          descriptionKey: "dataJournal.components.descriptions.oneWayAnova",
          descriptionFallback:
            "Compare means across three or more groups in one test.",
          createPayload: () => ({
            title: t("dataJournal.components.items.oneWayAnova", "One Way Anova"),
            type: "STATTEST",
            content: { type: "oneWayAnova", code: testTemplates?.oneWayAnova },
          }),
        },
      ],
    },
    {
      sectionTitleKey: "dataJournal.components.sections.studyAssets",
      sectionTitleFallback: "Study Assets",
      cards: [
        {
          id: "table",
          imageSrc: "/assets/dataviz/componentPanel/table.svg",
          titleKey: "dataJournal.components.items.table",
          titleFallback: "Table",
          descriptionKey: "dataJournal.components.descriptions.table",
          descriptionFallback:
            "Insert a structured table to inspect and organize raw values.",
          createPayload: () => ({
            title: t("dataJournal.components.items.table", "Table"),
            type: "TABLE",
            content: {},
          }),
        },
        {
          id: "summary",
          imageSrc: "/assets/dataviz/componentPanel/summary.svg",
          titleKey: "dataJournal.components.items.summary",
          titleFallback: "Summary",
          descriptionKey: "dataJournal.components.descriptions.summary",
          descriptionFallback:
            "Generate key descriptive statistics for selected data.",
          createPayload: () => ({
            title: t("dataJournal.components.items.summary", "Summary"),
            type: "STATISTICS",
            content: { type: "summary", code: summaryTemplates?.summary },
          }),
        },
      ],
    },
  ];

  const renderCard = (card) => (
    <InfoTooltip
      key={card.id}
      content={t(card.descriptionKey, card.descriptionFallback)}
      tooltipStyle={{
        width: "100%",
        fontSize: "13px",
        lineHeight: "18px",
        color: "var(--MH-Theme-Neutrals-Black, #171717)",
        border: "1px solid #A1A1A1",
      }}
      wrapperStyle={{ width: "100%", display: "block" }}
    >
      <div
        className="card"
        onClick={async () => await handleAddComponent(card.createPayload())}
      >
        <div className="cardImage">
          <img src={card.imageSrc} alt={t(card.titleKey, card.titleFallback)} />
        </div>
        <div className="cardContent">
          <div className="cardTitle">{t(card.titleKey, card.titleFallback)}</div>
        </div>
      </div>
    </InfoTooltip>
  );

  return (
    <StyledComponentPanel>
      <div className="panelHeader">
        <div className="title">
          {t("dataJournal.components.title", "Component Panel")}
        </div>
        {typeof onClose === "function" && (
          <CompactActionButton
            kind="close"
            type="button"
            onClick={onClose}
            ariaLabel={t(
              "dataJournal.components.closePanel",
              "Close component panel"
            )}
            title={t(
              "dataJournal.components.closePanel",
              "Close component panel"
            )}
          />
        )}
      </div>
      <div>
        {componentSections.map((section) => (
          <div key={section.sectionTitleKey}>
            <div className="subtitle">
              {t(section.sectionTitleKey, section.sectionTitleFallback)}
            </div>
            <div className="cards">{section.cards.map(renderCard)}</div>
          </div>
        ))}
      </div>
    </StyledComponentPanel>
  );
}
