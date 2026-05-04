import React, { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import AggregateVarSelector from "../Fields/AggregateVarSelector";

const HV_COMMON = "dataJournal.hypVis.axes.common";
const ab = "dataJournal.hypVis.axes.abDesign";
const clip = "dataJournal.hypVis.axes.clipboard";

export default function Axes({
  user,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

  const [groupNb, setGroupNb] = useState(selectors?.ivConditions || 2);
  const [groupLabels, setGroupLabels] = useState({ group1: "", group2: "" });
  const [ratings, setRatings] = useState({});

  const topResourcesItems = useMemo(
    () => [
      {
        title: t(`${ab}.resources.experimentalHypothesis.title`, {}, {
          default: "What is an experimental hypothesis?",
        }),
        alt: t(`${ab}.resources.experimentalHypothesis.subtitle`, {}, {
          default: "Reference coming soon.",
        }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "",
      },
      {
        title: t(`${ab}.resources.rankOrdering.title`, {}, {
          default: "Rank-ordering predictions",
        }),
        alt: t(`${ab}.resources.rankOrdering.subtitle`, {}, {
          default: "Reference coming soon.",
        }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "",
      },
    ],
    [t],
  );

  const openLinkLabel = t(`${HV_COMMON}.resources.openLinkHint`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${HV_COMMON}.resources.noLink`, {}, { default: "No external link" });

  const topHelpContent = useMemo(
    () => (
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#625B71" }}>
        {t(`${HV_COMMON}.help.resourcesIntro`, {}, {
          default:
            "Use the buttons below to open a reference in a new tab when a link is available.",
        })}
      </p>
    ),
    [t],
  );
  const topHelpAction = useMemo(
    () => (
      <ResourcesTooltipResourceButtons
        items={topResourcesItems}
        openLinkLabel={openLinkLabel}
        noLinkHint={noLinkHint}
      />
    ),
    [topResourcesItems, openLinkLabel, noLinkHint],
  );

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
          t(`${clip}.fallbackDependentVariable`, {}, { default: "dependent variable" }),
        n: ivConditions || t(`${clip}.fallbackNumberOfConditions`, {}, { default: "number of" }),
        iv:
          independentVariable ||
          t(`${clip}.fallbackIndependentVariable`, {}, { default: "independent variable" }),
      },
      { default: "I predict that the {{dv}} will vary across the {{n}} conditions of the {{iv}} as follows:\n" },
    );

    for (let i = 1; i <= groupNb; i++) {
      const condition =
        selectors[`condition${i}`] ||
        t(`${clip}.fallbackCondition`, { n: i }, { default: "condition {{n}}" });
      const rank = selectors[`group${i}`] || 0;
      textContent += t(
        `${clip}.abDesignConditionLine`,
        { condition, rank },
        { default: "- {{condition}} will occupy rank #{{rank}}\n" },
      );
    }

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(
            `${ab}.clipboardHypothesisCopied`,
            { text: textContent },
            { default: "Text copied to clipboard: {{text}}" },
          ),
        );
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
  };

  const copyAiToClipboard = () => {
    if (selectors?.hypothesisPrompt === "") {
      return alert(
        t(`${ab}.describeHypothesisFirst`, {}, { default: "Please describe your hypothesis first" }),
      );
    }

    const textContent = "I";

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(
            `${ab}.clipboardAiCopied`,
            { text: textContent },
            { default: "AI-reformulated hypothesis copied to clipboard: {{text}}" },
          ),
        );
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
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
        {t(`${ab}.yourHypothesisHelpIntro`, {}, {
          default: "To build your experimental hypothesis, follow these steps:",
        })}
      </strong>
      <ol>
        <li>{t(`${ab}.yourHypothesisHelpStep1`, {}, { default: "Name your IV and DV" })}</li>
        <li>
          {t(`${ab}.yourHypothesisHelpStep2`, {}, {
            default: "State how many conditions your IV has",
          })}
        </li>
        <li>
          {t(`${ab}.yourHypothesisHelpStep3`, {}, {
            default: "Predict the DV values for each condition of the IV",
          })}
        </li>
      </ol>
    </div>
  );

  const rankHelpContent = (
    <div>
      <strong>{t(`${ab}.rankHelpIntro`, {}, { default: "If you have three conditions:" })}</strong>
      <ol>
        <li>
          {t(`${ab}.rankHelpStep1`, {}, {
            default: "Name each condition using the dropdown (you can type in!)",
          })}
        </li>
        <li>
          {t(`${ab}.rankHelpStep2`, {}, {
            default:
              "Use the slider on the right side of the label to indicate the expected rank of the DV in this condition compared to the rest",
          })}
        </li>
      </ol>
    </div>
  );

  const helpAria = t("dataJournal.hypVis.helpAriaLabel", {}, { default: "More information" });

  return (
    <div className="graph-dashboard">
      <SectionHeader
        title={t(`${ab}.headerTitle`, {}, { default: "Experimental Hypothesis" })}
        iconSrc="/assets/icons/visualize/hypVis_expeAnalysis.svg"
        iconAlt=""
        helpContent={topHelpContent}
        helpAction={topHelpAction}
        helpAriaLabel={t(`${HV_COMMON}.help.ariaLabel`, {}, { default: "Resources and help" })}
      />
      <div className="text-input">
        <label htmlFor="graphTitle" className="header-text">
          {t(`${ab}.titleLabel`, {}, { default: "Title" })}
        </label>
        <input
          className="input-box"
          placeholder={t(`${ab}.titlePlaceholder`, {}, { default: "Effect of condition on variable" })}
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
        <SectionHeader
          title={t(`${ab}.sectionHypothesisTitle`, {}, { default: "Your experimental hypothesis" })}
          helpContent={experimentalHelpContent}
          helpAriaLabel={helpAria}
        />
        <div className="text-input">
          <label htmlFor="dependentVariable" className="header-text">
            {t(`${ab}.dvLabel`, {}, { default: "What is the name of your Dependent Variable (DV)?" })}
          </label>
          <input
            className="input-box"
            placeholder={t(`${ab}.dvPlaceholder`, {}, { default: "Dependent variable" })}
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
            {t(`${ab}.ivLabel`, {}, { default: "What is the name of your Independent Variable (IV)?" })}
          </label>
          <input
            className="input-box"
            placeholder={t(`${ab}.ivPlaceholder`, {}, { default: "Independent variable" })}
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
              {},
              { default: "How many conditions does your Independent Variable (IV) have?" },
            )}
          </label>
          <input
            className="input-box-number"
            placeholder={t(`${ab}.ivConditionsPlaceholder`, {}, { default: "2" })}
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
        <SectionHeader
          title={t(`${ab}.rankSectionTitle`, {}, { default: "Rank your conditions" })}
          helpContent={rankHelpContent}
          helpAriaLabel={helpAria}
        />
        <div className="ranks-grid-l1">
          {Array.from({ length: groupNb }, (_, i) => (
            <div key={i} className="fill-in-ranks">
              <label>{t(`${ab}.iPredictThat`, {}, { default: "I predict that" })}</label>
              <AggregateVarSelector
                placeholder={
                  selectors[`condition${i + 1}`] ||
                  t(`${clip}.fallbackCondition`, { n: i + 1 }, { default: "condition {{n}}" })
                }
                isDirectionality={false}
                allowAdditions={true}
                value={selectors[`condition${i + 1}`] || ""}
                onChange={(e, { value }) =>
                  handleAggregateVarChange(`condition${i + 1}`, value)
                }
              />
              <span>{t(`${ab}.willOccupyRank`, {}, { default: "will occupy rank #" })}</span>
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
            <div>{t(`${ab}.copyHypothesis`, {}, { default: "Copy hypothesis text to clipboard" })}</div>
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
                  {},
                  { default: "Copy AI-formulated hypothesis text to clipboard (in progress)" },
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
