import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import { STUDY_DATA_SOURCES } from "../../../../Queries/DataSourceBlock";
import { CREATE_STUDY_DATA_SOURCE } from "../../../../Mutations/DataSourceBlock";
import { matchStudySources } from "../../../../Visuals/Helpers/studySources";

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
};

const ROW_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
};

/**
 * The devices a visual block reads from. Inside a study those come from the
 * study's own linked data sources — participants connect them once, before
 * the first step — so each one the study hasn't linked yet can be linked from
 * here.
 *
 * @param {object} visual - The task's visual, with `dataSources`.
 * @param {object} study
 */
export default function VisualDevices({ visual, study }) {
  const { t } = useTranslation("builder");
  const sources = visual?.dataSources || [];
  const [linking, setLinking] = useState(false);

  const { data } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId: study?.id },
    skip: !study?.id || !sources.length,
  });
  const studySources = data?.studyDataSources || [];
  const [createStudyDataSource] = useMutation(CREATE_STUDY_DATA_SOURCE, {
    refetchQueries: [
      { query: STUDY_DATA_SOURCES, variables: { studyId: study?.id } },
    ],
  });

  if (!sources.length) return null;

  const matched = matchStudySources(sources, studySources);
  const missing = sources.filter((source) => !matched[source.id]);

  const link = async (toLink) => {
    setLinking(true);
    try {
      for (const [index, source] of toLink.entries()) {
        await createStudyDataSource({
          variables: {
            data: {
              study: { connect: { id: study.id } },
              block: { connect: { id: source.block.id } },
              label: source.label,
              inputBindings: source.inputBindings,
              order: studySources.length + index,
              scope: "study",
            },
          },
        });
      }
    } finally {
      setLinking(false);
    }
  };

  return (
    <section className="blockPanelSection">
      <div className="onLineHeader">
        <h2 style={{ flex: 1 }}>
          {t("viewer.devices", {}, { default: "Devices" })}
        </h2>
        {missing.length > 1 && (
          <Button
            variant="tonal"
            disabled={linking}
            onClick={() => link(missing)}
          >
            {t("viewer.linkAllDevices", {}, { default: "Link all" })}
          </Button>
        )}
      </div>
      <p className="blockPanelMuted">
        {missing.length
          ? t(
              "viewer.devicesToLink",
              {},
              {
                default:
                  "This visual reacts to data from these devices. Link them to your study so participants connect them before the study starts.",
              }
            )
          : t(
              "viewer.devicesLinked",
              {},
              {
                default:
                  "Every device this visual reads from is linked to your study.",
              }
            )}
      </p>
      {sources.map((source) => (
        <div key={source.id} className="blockPanelCard" style={ROW_STYLE}>
          <div style={ROW_TEXT_STYLE}>
            <p className="MH-Type-Title-Base" style={{ margin: 0 }}>
              {source.label || source.block?.title}
            </p>
            {source.block?.requirementLabel && (
              <p className="blockPanelMuted" style={{ margin: 0 }}>
                {source.block.requirementLabel}
              </p>
            )}
          </div>
          {matched[source.id] ? (
            <Chip
              variant="static"
              tone="success"
              label={t("viewer.deviceLinked", {}, { default: "Linked" })}
            />
          ) : (
            <Button
              variant="text"
              disabled={linking}
              onClick={() => link([source])}
            >
              {t("viewer.linkDevice", {}, { default: "Link to study" })}
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}
