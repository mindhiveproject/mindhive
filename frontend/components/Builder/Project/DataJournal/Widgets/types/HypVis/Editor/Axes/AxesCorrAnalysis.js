import React, { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import {
  GET_STUDY_FLOW,
  GET_BLOCK_AGGVAR,
} from "../../../../../../../../Queries/Study";

import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import AggregateVarSelector from "../Fields/AggregateVarSelector";

const HV_COMMON = "dataJournal.hypVis.axes.common";
const corr = "dataJournal.hypVis.axes.corr";
const clip = "dataJournal.hypVis.axes.clipboard";

export default function Axes({
  studyId,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

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

  const topResourcesItems = useMemo(
    () => [
      {
        title: t(`${corr}.resources.correlationalHypothesis.title`, {}, {
          default: "What is a correlational hypothesis?",
        }),
        alt: t(`${corr}.resources.correlationalHypothesis.subtitle`, {}, {
          default: "Reference coming soon.",
        }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "",
      },
      {
        title: t(`${corr}.resources.directionality.title`, {}, {
          default: "Choosing directionality terms",
        }),
        alt: t(`${corr}.resources.directionality.subtitle`, {}, {
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
      { default: "I predict that {{ivDir}} {{iv}} will be related to {{dvDir}} {{dv}}." },
    );

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        alert(
          t(
            `${corr}.clipboardHypothesisCopied`,
            { text: textContent },
            { default: "Text copied to clipboard: {{text}}" },
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

  const correlationalHelpContent = (
    <div>
      <p>
        {t(`${corr}.helpIntro`, {}, {
          default: "Fill in the blanks to create your correlational hypothesis!",
        })}
      </p>
      <p>
        {t(`${corr}.helpForInstance`, {}, { default: "For instance" })}
        <br />
        <q>
          {t(`${corr}.helpExampleQuote`, {}, {
            default: "It is predicted that higher anxiety will be related to lower % of trials gambled.",
          })}
        </q>
      </p>
      <p>
        <i>
          {t(`${corr}.helpNote`, {}, {
            default:
              "Note that the options suggested under the variable fields are pulled from the public blocks in your study builder",
          })}
        </i>
      </p>
    </div>
  );

  const helpAria = t("dataJournal.hypVis.helpAriaLabel", {}, { default: "More information" });

  if (loading) return <p>{t(`${corr}.loading`, {}, { default: "Loading..." })}</p>;
  if (error)
    return (
      <p>
        {t(`${corr}.errorLoading`, { message: error.message }, { default: "Error: {{message}}" })}
      </p>
    );
  if (aggVarLoading)
    return <p>{t(`${corr}.loadingBlocks`, {}, { default: "Loading block data..." })}</p>;
  if (aggVarError)
    return (
      <p>
        {t(
          `${corr}.errorLoadingBlocks`,
          { message: aggVarError.message },
          { default: "Error loading block data: {{message}}" },
        )}
      </p>
    );

  return (
    <div className="graph-dashboard">
      <SectionHeader
        title={t(`${corr}.headerTitle`, {}, { default: "Correlational Hypothesis" })}
        iconSrc="/assets/icons/visualize/hypVis_corrAnalysis.svg"
        iconAlt=""
        helpContent={topHelpContent}
        helpAction={topHelpAction}
        helpAriaLabel={t(`${HV_COMMON}.help.ariaLabel`, {}, { default: "Resources and help" })}
      />
      <div className="text-input">
        <label htmlFor="graphTitle" className="header-text">
          {t(`${corr}.titleLabel`, {}, { default: "Title" })}
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
        <SectionHeader
          title={t(`${corr}.sectionTitle`, {}, { default: "Your correlational hypothesis" })}
          helpContent={correlationalHelpContent}
          helpAriaLabel={helpAria}
        />
        <div className="fill-in-the-blanks">
          <div className="text">
            {t(`${corr}.iPredictThat`, {}, { default: "I predict that" })}
          </div>

          <AggregateVarSelector
            placeholder={t(`${corr}.directionalityPlaceholder`, {}, { default: "directionality" })}
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
              t(`${corr}.independentPlaceholder`, {}, { default: "independent variable" })
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
            {t(`${corr}.willBeRelatedTo`, {}, { default: "will be related to" })}
          </div>
          <AggregateVarSelector
            placeholder={t(`${corr}.directionalityPlaceholder`, {}, { default: "directionality" })}
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
              t(`${corr}.dependentPlaceholder`, {}, { default: "dependent variable" })
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
            {t(`${corr}.copyHypothesis`, {}, { default: "Copy hypothesis text to clipboard" })}
          </div>
          <img src="/assets/icons/visualize/clipboard-copy.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
