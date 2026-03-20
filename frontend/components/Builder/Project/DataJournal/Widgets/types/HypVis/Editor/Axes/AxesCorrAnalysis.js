import React from "react";
import useTranslation from "next-translate/useTranslation";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import {
  GET_STUDY_FLOW,
  GET_BLOCK_AGGVAR,
} from "../../../../../../../../Queries/Study";

import InfoTooltip from "../../../../../../../../DesignSystem/InfoTooltip";
import AggregateVarSelector from "../Fields/AggregateVarSelector";

const hypVisTooltipStyle = {
  fontFamily: "Inter",
  fontSize: "14px",
  lineHeight: "20px",
  maxWidth: "min(calc(100vw - 32px), 400px)",
  width: "max-content",
};

export default function Axes({
  studyId,
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");
  const corr = "dataJournal.hypVis.axes.corr";
  const clip = "dataJournal.hypVis.axes.clipboard";

  const router = useRouter();
  const currentLocale = router.locale || "en-us";

  const { data, loading, error } = useQuery(GET_STUDY_FLOW, {
    variables: {
      where: {
        id: {
          equals: studyId,
        },
      },
    },
  });

  const flow = data?.studies?.[0]?.flow || [];

  const aggregateVarOptions = flow
    .filter((block) => block.componentID)
    .map((block) => ({
      label: block.name || block.type,
      ID: block.componentID,
    }));

  const taskIds = aggregateVarOptions.map((block) => block.ID);

  const {
    data: aggVarData,
    loading: aggVarLoading,
    error: aggVarError,
  } = useQuery(GET_BLOCK_AGGVAR, {
    variables: {
      where: {
        id: {
          in: taskIds,
        },
      },
    },
  });

  const optionsAggVar =
    aggVarData?.tasks?.flatMap((task) => {
      const settings =
        task?.i18nContent?.[currentLocale]?.settings || task?.settings;

      try {
        return JSON.parse(settings?.aggregateVariables || "[]");
      } catch (e) {
        console.error(
          "Failed to parse aggregateVariables",
          e,
          settings?.aggregateVariables,
        );
        return [];
      }
    }) || [];

  const formattedItems = optionsAggVar.map((item) => {
    const varName = typeof item === "string" ? item : item.varName;
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(varName, "text/html");
    const strippedContent = parsedDoc.body.textContent || "";

    return {
      key: strippedContent.toLowerCase().replace(/\s+/g, "-"),
      text: strippedContent,
      value: strippedContent,
    };
  });

  const copyToClipboard = () => {
    const {
      ivDirectionality,
      independentVariable,
      dvDirectionality,
      dependentVariable,
    } = selectors;
    const textContent = t(
      `${clip}.corrHypothesis`,
      {
        ivDir: ivDirectionality || "",
        iv: independentVariable || "",
        dvDir: dvDirectionality || "",
        dv: dependentVariable || "",
      },
      "I predict that {{ivDir}} {{iv}} will be related to {{dvDir}} {{dv}}.",
    );

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(`${corr}.clipboardHypothesisCopied`, { text: textContent }, "Text copied to clipboard: {{text}}"),
        );
      })
      .catch((err) => {
        console.error("Error copying text: ", err);
      });
  };

  const copyFigToClipboard = async () => {
    try {
      try {
        const variableValue = await pyodide.runPythonAsync("fig_html");
        await navigator.clipboard.writeText(variableValue);
        alert(t(`${corr}.clipboardFigCopied`, "Copied to clipboard!"));
      } catch (error) {
        console.error("Failed to retrieve variable: ", error);
      }
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

  const correlationalHelpContent = (
    <div>
      <p>
        {t(
          `${corr}.helpIntro`,
          "Fill in the blanks to create your correlational hypothesis!",
        )}
      </p>
      <p>
        {t(`${corr}.helpForInstance`, "For instance")}
        <br />
        <q>
          {t(
            `${corr}.helpExampleQuote`,
            "It is predicted that higher anxiety will be related to lower % of trials gambled.",
          )}
        </q>
      </p>
      <p>
        <i>
          {t(
            `${corr}.helpNote`,
            "Note that the options suggested under the variable fields are pulled from the public blocks in your study builder",
          )}
        </i>
      </p>
    </div>
  );

  if (loading) return <p>{t(`${corr}.loading`, "Loading...")}</p>;
  if (error)
    return (
      <p>
        {t(`${corr}.errorLoading`, { message: error.message }, "Error: {{message}}")}
      </p>
    );
  if (aggVarLoading)
    return <p>{t(`${corr}.loadingBlocks`, "Loading block data...")}</p>;
  if (aggVarError)
    return (
      <p>
        {t(
          `${corr}.errorLoadingBlocks`,
          { message: aggVarError.message },
          "Error loading block data: {{message}}",
        )}
      </p>
    );

  return (
    <div className="graph-dashboard">
      <div className="header">
        <img src="/assets/icons/visualize/hypVis_corrAnalysis.svg" alt="" />
        <div className="header-title">
          {t(`${corr}.headerTitle`, "Correlational Hypothesis")}
        </div>
      </div>
      <div className="text-input">
        <label htmlFor="graphTitle" className="header-text">
          {t(`${corr}.titleLabel`, "Title")}
        </label>
        <input
          className="input-box"
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
            {t(`${corr}.sectionTitle`, "Your correlational hypothesis")}
          </div>
          <InfoTooltip
            content={correlationalHelpContent}
            tooltipStyle={hypVisTooltipStyle}
            position="bottomRight"
          >
            <img
              src="/assets/icons/visualize/question_mark.svg"
              alt={t("dataJournal.hypVis.helpAriaLabel", "More information")}
            />
          </InfoTooltip>
        </div>
        <div className="fill-in-the-blanks">
          <div className="text">
            {t(`${corr}.iPredictThat`, "I predict that")}
          </div>

          <AggregateVarSelector
            placeholder={t(`${corr}.directionalityPlaceholder`, "directionality")}
            isDirectionality={true}
            allowAdditions={false}
            optionsAggVar={formattedItems}
            studyId={studyId}
            value={selectors.ivDirectionality || ""}
            onChange={(e, { value }) =>
              handleAggregateVarChange("ivDirectionality", value)
            }
          />
          <AggregateVarSelector
            placeholder={
              selectors.independentVariable ||
              t(`${corr}.independentPlaceholder`, "independent variable")
            }
            isDirectionality={false}
            allowAdditions={true}
            optionsAggVar={formattedItems}
            studyId={studyId}
            value={selectors[`independentVariable`] || ""}
            onChange={(e, { value }) =>
              handleAggregateVarChange("independentVariable", value)
            }
          />
          <div className="text">
            {t(`${corr}.willBeRelatedTo`, "will be related to")}
          </div>
          <AggregateVarSelector
            placeholder={t(`${corr}.directionalityPlaceholder`, "directionality")}
            isDirectionality={true}
            allowAdditions={false}
            optionsAggVar={formattedItems}
            studyId={studyId}
            value={selectors.dvDirectionality || ""}
            onChange={(e, { value }) =>
              handleAggregateVarChange("dvDirectionality", value)
            }
          />
          <AggregateVarSelector
            placeholder={
              selectors[`dependentVariable`] ||
              t(`${corr}.dependentPlaceholder`, "dependent variable")
            }
            isDirectionality={false}
            allowAdditions={true}
            optionsAggVar={formattedItems}
            studyId={studyId}
            value={selectors[`dependentVariable`] || ""}
            onChange={(e, { value }) =>
              handleAggregateVarChange("dependentVariable", value)
            }
          />
        </div>
      </div>
      <div className="button-panel">
        <div className="clipboard-copy-button" onClick={copyToClipboard}>
          <div>
            {t(`${corr}.copyHypothesis`, "Copy hypothesis text to clipboard")}
          </div>
          <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
        </div>
        <div
          className="clipboard-fig-copy-button"
          onClick={copyFigToClipboard}
        >
          <div>{t(`${corr}.copyGraph`, "Copy graph to clipboard")}</div>
          <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
