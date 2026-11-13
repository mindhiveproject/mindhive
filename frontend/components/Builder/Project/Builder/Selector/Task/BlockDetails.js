import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import Card from "../../../../../DesignSystem/Card";
import Chip from "../../../../../DesignSystem/Chip";
import Button from "../../../../../DesignSystem/Button";
import InfoPopover from "../../../../../DesignSystem/InfoPopover";
import {
  ArrowDropDownIcon,
  AssignmentIcon,
} from "../../../../../DesignSystem/Icons";

// Two columns on a wide modal (the block's content, then its facts); one
// column, in the same order, when the modal is narrow.
const StyledBlockDetails = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 32px;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }

  .blockDetailsColumn {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }

  .blockDetailsSection {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .blockDetailsSection h3 {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .blockDetailsSection p {
    margin: 0;
  }

  .blockDetailsMuted {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .blockDetailsHtml {
    overflow-wrap: anywhere;
  }

  .blockDetailsHtml p + p {
    margin-top: 8px;
  }

  .blockDetailsImage {
    display: block;
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  }

  .blockDetailsItems {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .blockDetailsItem {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .blockDetailsItemTitle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .blockDetailsItemTitle svg {
    flex-shrink: 0;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  .blockDetailsList {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .blockDetailsVariable {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .blockDetailsDisclosure svg {
    transition: transform 0.2s;
  }

  .blockDetailsDisclosure--open svg {
    transform: rotate(180deg);
  }
`;

const safeParse = (value, fallback = []) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const SURVEY_ITEM_LABELS = {
  text: { key: "taskPage.text", default: "Text" },
  vas: { key: "taskPage.vas", default: "Visual analogue scale" },
  likert: { key: "taskPage.likert", default: "Likert scale" },
  freeinput: { key: "taskPage.freeinput", default: "Free text input" },
  select: { key: "taskPage.select", default: "Select one" },
  checkbox: { key: "taskPage.checkbox", default: "Select many" },
};

function Section({ title, children }) {
  return (
    <section className="blockDetailsSection">
      <h3 className="MH-Type-Title-Small">{title}</h3>
      {children}
    </section>
  );
}

function ParameterList({ items }) {
  return (
    <Card variant="filled">
      <div className="blockDetailsItems">
        {items.map((item, num) => (
          <div className="blockDetailsItem" key={num}>
            <span className="blockDetailsItemTitle MH-Type-Label-Base">
              <AssignmentIcon width={20} height={20} aria-hidden />
              {item.label}
            </span>
            {item.lines.map((line, lineNum) =>
              line ? (
                <div
                  className="blockDetailsHtml blockDetailsMuted MH-Type-Body-Base"
                  key={lineNum}
                >
                  {ReactHtmlParser(line)}
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// The block's details in the builder's info modal: the same sections, in the
// same order, as the task landing page (Tasks/Landing/TaskPage).
export default function BlockDetails({ task }) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const taskType = task?.taskType?.toLowerCase();
  const settings =
    task?.i18nContent?.[locale]?.settings ?? task?.settings ?? {};
  const resources = safeParse(settings?.resources);
  const aggregateVariables = safeParse(settings?.aggregateVariables);

  const allParameters =
    task?.i18nContent?.[locale]?.parameters ?? task?.parameters ?? [];
  const parameters = allParameters
    .filter((param) => param?.type !== "survey")
    .map((param) => ({
      label: param?.help || param?.name,
      lines: [param?.value],
    }));
  const surveyItems = allParameters
    .filter((param) => param?.type === "survey")
    .flatMap((param) => {
      const pages = safeParse(param?.value, null);
      return Array.isArray(pages) ? pages : [];
    })
    .flatMap((page) => page?.page || [])
    .filter(Boolean)
    .map((item) => {
      const label = SURVEY_ITEM_LABELS[item?.type];
      return {
        label: label ? t(label.key, {}, { default: label.default }) : "",
        lines: [item?.header, item?.text],
      };
    });

  const parametersIntro = (
    <>
      <p className="MH-Type-Body-Base">
        {t(
          "taskPage.parametersDescription",
          { taskType },
          {
            default: `The following features of this ${taskType} can be tweaked:`,
          }
        )}
      </p>
      <p className="blockDetailsMuted MH-Type-Body-Small">
        {t(
          "taskPage.parametersNote",
          { taskType },
          {
            default: `* Default values are shown (can clone ${taskType} and modify these)`,
          }
        )}
      </p>
    </>
  );

  return (
    <StyledBlockDetails>
      <div className="blockDetailsColumn">
        {task?.image && (
          <Section title={t("taskPage.screenshot", {}, { default: "Screenshot" })}>
            <img className="blockDetailsImage" src={task.image} alt="" />
          </Section>
        )}

        {settings?.background && (
          <Section title={t("taskPage.background", {}, { default: "Background" })}>
            <div className="blockDetailsHtml MH-Type-Body-Base">
              {ReactHtmlParser(settings.background)}
            </div>
          </Section>
        )}

        {parameters.length > 0 && (
          <Section title={t("taskPage.parameters", {}, { default: "Parameters" })}>
            {parametersIntro}
            <ParameterList items={parameters} />
          </Section>
        )}

        {surveyItems.length > 0 && (
          <Section
            title={t(
              "taskPage.surveyParameters",
              {},
              { default: "Survey parameters" }
            )}
          >
            {parametersIntro}
            <ParameterList items={surveyItems} />
          </Section>
        )}

        {settings?.descriptionBefore && (
          <Section
            title={t(
              "taskPage.before",
              { taskType },
              { default: `What participants see before taking the ${taskType}` }
            )}
          >
            <Card variant="filled">
              <p
                className="MH-Type-Body-Base"
                style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
              >
                {settings.descriptionBefore}
              </p>
            </Card>
          </Section>
        )}

        {settings?.descriptionAfter && (
          <Section
            title={t(
              "taskPage.after",
              { taskType },
              { default: `What participants see after taking the ${taskType}` }
            )}
          >
            <Card variant="filled">
              <p
                className="MH-Type-Body-Base"
                style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
              >
                {settings.descriptionAfter}
              </p>
            </Card>
          </Section>
        )}
      </div>

      <div className="blockDetailsColumn">
        {task?.settings?.mobileCompatible && (
          <div>
            <Chip
              variant="static"
              label={t(
                "taskPage.mobileCompatible",
                {},
                { default: "Mobile compatible" }
              )}
            />
          </div>
        )}

        {aggregateVariables.length > 0 && (
          <Section
            title={t(
              "taskPage.aggregateVariables",
              {},
              { default: "Aggregate Variables" }
            )}
          >
            <p className="MH-Type-Body-Base">
              {t(
                "taskPage.aggregateVariablesDescription",
                { taskType },
                {
                  default: `These data are automatically written to a csv file upon completion of the ${taskType}`,
                }
              )}
            </p>
            {settings?.addInfo && (
              <>
                <div>
                  <Button
                    variant="text"
                    className={
                      showMoreInfo
                        ? "blockDetailsDisclosure blockDetailsDisclosure--open"
                        : "blockDetailsDisclosure"
                    }
                    aria-expanded={showMoreInfo}
                    trailingIcon={<ArrowDropDownIcon aria-hidden />}
                    onClick={() => setShowMoreInfo(!showMoreInfo)}
                  >
                    {t("taskPage.moreInfo", {}, { default: "more info" })}
                  </Button>
                </div>
                {showMoreInfo && (
                  <div className="blockDetailsHtml MH-Type-Body-Base">
                    {ReactHtmlParser(settings.addInfo)}
                  </div>
                )}
              </>
            )}
            <ul className="blockDetailsList MH-Type-Body-Base">
              {aggregateVariables.map((variable, idx) => (
                <li key={variable?.varName || idx}>
                  <span className="blockDetailsVariable">
                    {ReactHtmlParser(variable?.varName || "")}
                    {variable?.varDesc && (
                      <InfoPopover
                        content={ReactHtmlParser(variable.varDesc)}
                        ariaLabel={variable?.varName}
                      />
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {settings?.scoring && (
          <Section title={t("taskPage.scoring", {}, { default: "Scoring" })}>
            <div className="blockDetailsHtml MH-Type-Body-Base">
              {ReactHtmlParser(settings.scoring)}
            </div>
          </Section>
        )}

        {settings?.format && (
          <Section title={t("taskPage.format", {}, { default: "Format" })}>
            <div className="blockDetailsHtml MH-Type-Body-Base">
              {ReactHtmlParser(settings.format)}
            </div>
          </Section>
        )}

        {settings?.duration && (
          <Section title={t("taskPage.duration", {}, { default: "Duration" })}>
            <p className="MH-Type-Body-Base">{settings.duration}</p>
          </Section>
        )}

        {resources.length > 0 && (
          <Section title={t("taskPage.resources", {}, { default: "Resources" })}>
            <ul className="blockDetailsList blockDetailsHtml MH-Type-Body-Base">
              {resources.map((resource, num) => (
                <li key={num}>{ReactHtmlParser(resource)}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </StyledBlockDetails>
  );
}
