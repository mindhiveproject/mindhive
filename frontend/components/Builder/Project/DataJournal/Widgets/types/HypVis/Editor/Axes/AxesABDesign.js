import React, { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import InfoTooltip from "../../../../../../../../DesignSystem/InfoTooltip";
import AggregateVarSelector from "../Fields/AggregateVarSelector";
import { figHtmlStringFromPyodide } from "./figHtmlFromPyodide";

const hypVisTooltipStyle = {
  fontFamily: "Inter",
  fontSize: "14px",
  lineHeight: "20px",
  maxWidth: "min(calc(100vw - 32px), 400px)",
  width: "max-content",
};

export default function Axes({
  user,
  variables,
  sectionId,
  selectors,
  onChange,
  pyodide,
}) {
  const { t } = useTranslation("builder");
  const ab = "dataJournal.hypVis.axes.abDesign";
  const clip = "dataJournal.hypVis.axes.clipboard";

  const [groupNb, setGroupNb] = useState(selectors?.ivConditions || 2);
  const [groupLabels, setGroupLabels] = useState({ group1: "", group2: "" });
  const [ratings, setRatings] = useState({});

  const handleRatingChange = (e, group) => {
    const newRating = e.target.value;
    setRatings((prevRatings) => ({ ...prevRatings, [group]: newRating }));
    setGroupLabels((prevGroupLabels) => ({
      ...prevGroupLabels,
      [group]: newRating,
    }));
    onChange({
      componentId: sectionId,
      newContent: { selectors: { ...selectors, [group]: newRating } },
    });
  };

  const handleGroupNbChange = (e) => {
    const newGroupNb = parseInt(e.target.value, 10);
    setGroupNb(newGroupNb);

    const newGroupLabels = {};
    for (let i = 1; i <= newGroupNb; i++) {
      newGroupLabels[`group${i}`] = groupLabels[`group${i}`] || "";
    }
    setGroupLabels(newGroupLabels);
  };

  const copyToClipboard = () => {
    const { dependentVariable, independentVariable, ivConditions } = selectors;
    let textContent = t(
      `${clip}.abDesignIntro`,
      {
        dv:
          dependentVariable ||
          t(`${clip}.fallbackDependentVariable`, "dependent variable"),
        n:
          ivConditions ||
          t(`${clip}.fallbackNumberOfConditions`, "number of"),
        iv:
          independentVariable ||
          t(`${clip}.fallbackIndependentVariable`, "independent variable"),
      },
      "I predict that the {{dv}} will vary across the {{n}} conditions of the {{iv}} as follows:\n",
    );

    for (let i = 1; i <= groupNb; i++) {
      const condition =
        selectors[`condition${i}`] ||
        t(`${clip}.fallbackCondition`, { n: i }, "condition {{n}}");
      const rank = selectors[`group${i}`] || 0;
      textContent += t(
        `${clip}.abDesignConditionLine`,
        { condition, rank },
        "- {{condition}} will occupy rank #{{rank}}\n",
      );
    }

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(`${ab}.clipboardHypothesisCopied`, { text: textContent }, "Text copied to clipboard: {{text}}"),
        );
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
  };

  const copyAiToClipboard = () => {
    if (selectors?.hypothesisPrompt === "") {
      return alert(
        t(`${ab}.describeHypothesisFirst`, "Please describe your hypothesis first"),
      );
    }

    const textContent = "I";

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(`${ab}.clipboardAiCopied`, { text: textContent }, "AI-reformulated hypothesis copied to clipboard: {{text}}"),
        );
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
  };

  const copyFigToClipboard = async () => {
    if (!pyodide) {
      alert(
        t(
          `${clip}.copyGraphNoPyodide`,
          "The Python runtime is not ready yet. Please wait for the journal to finish loading.",
        ),
      );
      return;
    }
    try {
      const variableValue = figHtmlStringFromPyodide(pyodide);
      if (!variableValue?.trim()) {
        alert(
          t(
            `${clip}.copyGraphNoFigHtml`,
            "No graph is available yet. Fill in your variables and wait for the visualization to appear in the journal, then try again.",
          ),
        );
        return;
      }
      await navigator.clipboard.writeText(variableValue);
      alert(t(`${ab}.clipboardFigCopied`, "Copied to clipboard!"));
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };

  const handleAggregateVarChange = (name, value) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [name]: value },
      },
    });
  };

  const handleIvConditionsChange = (e) => {
    onChange({
      componentId: sectionId,
      newContent: { selectors: { ...selectors, ivConditions: e.target.value } },
    });
    handleGroupNbChange(e);
  };

  const experimentalHelpContent = (
    <div>
      <strong>
        {t(
          `${ab}.yourHypothesisHelpIntro`,
          "To build your experimental hypothesis, follow these steps:",
        )}
      </strong>
      <ol>
        <li>
          {t(`${ab}.yourHypothesisHelpStep1`, "Name your IV and DV")}
        </li>
        <li>
          {t(
            `${ab}.yourHypothesisHelpStep2`,
            "State how many conditions your IV has",
          )}
        </li>
        <li>
          {t(
            `${ab}.yourHypothesisHelpStep3`,
            "Predict the DV values for each condition of the IV",
          )}
        </li>
      </ol>
    </div>
  );

  const rankHelpContent = (
    <div>
      <strong>{t(`${ab}.rankHelpIntro`, "If you have three conditions:")}</strong>
      <ol>
        <li>
          {t(
            `${ab}.rankHelpStep1`,
            "Name each condition using the dropdown (you can type in!)",
          )}
        </li>
        <li>
          {t(
            `${ab}.rankHelpStep2`,
            "Use the slider on the right side of the label to indicate the expected rank of the DV in this condition compared to the rest",
          )}
        </li>
      </ol>
    </div>
  );

  return (
    <div className="graph-dashboard">
      <div className="header">
        <img src="/assets/icons/visualize/hypVis_expeAnalysis.svg" alt="" />
        <div className="header-title">
          {t(`${ab}.headerTitle`, "Experimental Hypothesis")}
        </div>
      </div>
      <div className="text-input">
        <label htmlFor="graphTitle" className="header-text">
          {t(`${ab}.titleLabel`, "Title")}
        </label>
        <input
          className="input-box"
          placeholder={t(`${ab}.titlePlaceholder`, "Effect of condition on variable")}
          id={`title-${sectionId}`}
          type="text"
          name="graphTitle"
          value={selectors.graphTitle || ""}
          onChange={({ target }) =>
            onChange({
              componentId: sectionId,
              newContent: {
                selectors: { ...selectors, graphTitle: target.value },
              },
            })
          }
        />
      </div>
      <div className="parameter-panel">
        <div className="header">
          <div className="header-title">
            {t(`${ab}.sectionHypothesisTitle`, "Your experimental hypothesis")}
          </div>
          <InfoTooltip
            content={experimentalHelpContent}
            tooltipStyle={hypVisTooltipStyle}
            position="bottomRight"
          >
            <img
              src="/assets/icons/visualize/question_mark.svg"
              alt={t("dataJournal.hypVis.helpAriaLabel", "More information")}
            />
          </InfoTooltip>
        </div>
        <div className="text-input">
          <label htmlFor="dependentVariable" className="header-text">
            {t(`${ab}.dvLabel`, "What is the name of your Dependent Variable (DV)?")}
          </label>
          <input
            className="input-box"
            placeholder={t(`${ab}.dvPlaceholder`, "Dependent variable")}
            id={`dependentVariable-${sectionId}`}
            type="text"
            name="dependentVariable"
            value={selectors.dependentVariable || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: { ...selectors, dependentVariable: target.value },
                },
              })
            }
          />
        </div>
        <div className="text-input">
          <label htmlFor="independentVariable" className="header-text">
            {t(`${ab}.ivLabel`, "What is the name of your Independent Variable (IV)?")}
          </label>
          <input
            className="input-box"
            placeholder={t(`${ab}.ivPlaceholder`, "Independent variable")}
            id={`independentVariable-${sectionId}`}
            type="text"
            name="independentVariable"
            value={selectors.independentVariable || ""}
            onChange={({ target }) =>
              onChange({
                componentId: sectionId,
                newContent: {
                  selectors: {
                    ...selectors,
                    independentVariable: target.value,
                  },
                },
              })
            }
          />
        </div>
        <div className="text-input">
          <label htmlFor="ivConditions" className="header-text">
            {t(
              `${ab}.ivConditionsLabel`,
              "How many conditions does your Independent Variable (IV) have?",
            )}
          </label>
          <input
            className="input-box-number"
            placeholder={t(`${ab}.ivConditionsPlaceholder`, "2")}
            id={`ivConditions-${sectionId}`}
            type="number"
            name="ivConditions"
            value={selectors.ivConditions || ""}
            min="2"
            max="10"
            onChange={handleIvConditionsChange}
          />
        </div>
      </div>
      <div className="parameter-panel">
        <div className="header">
          <div className="header-title">
            {t(`${ab}.rankSectionTitle`, "Rank your conditions")}
          </div>
          <InfoTooltip
            content={rankHelpContent}
            tooltipStyle={hypVisTooltipStyle}
            position="bottomRight"
          >
            <img
              src="/assets/icons/visualize/question_mark.svg"
              alt={t("dataJournal.hypVis.helpAriaLabel", "More information")}
            />
          </InfoTooltip>
        </div>
        <div className="ranks-grid-l1">
          {Array.from({ length: groupNb }, (_, i) => (
            <div key={i} className="fill-in-ranks">
              <label>{t(`${ab}.iPredictThat`, "I predict that")}</label>
              <AggregateVarSelector
                placeholder={
                  selectors[`condition${i + 1}`] ||
                  t(`${clip}.fallbackCondition`, { n: i + 1 }, "condition {{n}}")
                }
                isDirectionality={false}
                allowAdditions={true}
                value={selectors[`condition${i + 1}`] || ""}
                onChange={(e, { value }) =>
                  handleAggregateVarChange(`condition${i + 1}`, value)
                }
              />
              <span>{t(`${ab}.willOccupyRank`, "will occupy rank #")}</span>
              <div className="fill-in-ranks">
                <div>
                  {selectors[`group${i + 1}`] || 0}/{groupNb}
                </div>
                <input
                  type="range"
                  min={0}
                  max={groupNb}
                  value={selectors[`group${i + 1}`] || 0}
                  onChange={(e) => handleRatingChange(e, `group${i + 1}`)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="button-panel">
          <div className="clipboard-copy-button" onClick={copyToClipboard}>
            <div>{t(`${ab}.copyHypothesis`, "Copy hypothesis text to clipboard")}</div>
            <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
          </div>
          <div
            className="clipboard-fig-copy-button"
            onClick={copyFigToClipboard}
          >
            <div>{t(`${ab}.copyGraph`, "Copy graph to clipboard")}</div>
            <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
          </div>
          {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
            <div
              className="clipboard-AI-copy-button"
              onClick={copyAiToClipboard}
            >
              <div>
                {t(
                  `${ab}.copyAiHypothesis`,
                  "Copy AI-formulated hypothesis text to clipboard (in progress)",
                )}
              </div>
              <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
