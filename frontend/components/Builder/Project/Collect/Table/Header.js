import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import DownloadRawData from "../Download/RawData";
import DownloadSummaryData from "../Download/Summary";
import DownloadByComponent from "../Download/ByComponent";
import Button from "../../../../DesignSystem/Button";
import CopyButton from "../../../../DesignSystem/CopyButton";
import Tooltip from "../../../../DesignSystem/Tooltip";
import DownloadEmptyNotice, {
  getDownloadEmptyReason,
} from "../Download/EmptyNotice";

export default function Header({
  study,
  slug,
  participants,
  components,
  loading,
}) {
  const { t } = useTranslation("builder");
  const { origin } = absoluteUrl();

  // filter out the datasets with explicit disagreement for data sharing (data policy is "no")
  //   ?.filter((dataset) => dataset?.dataPolicy !== "no")
  const fileDirs =
    study?.datasets
      ?.filter((dataset) => dataset?.isCompleted && dataset?.isIncluded)
      .map(
        (dataset) => dataset?.date.replaceAll("-", "/") + "/" + dataset?.token
      ) || [];

  const filteredDatasetTokens = study?.datasets
    ?.filter((dataset) => dataset?.isCompleted && dataset?.isIncluded)
    .map((dataset) => dataset?.token);

  const studyLink = `${origin}/studies/${slug}`;
  const copyAria = t("header.copyLinkAria", "Copy study link to clipboard");

  const emptyReason = loading
    ? "loading"
    : getDownloadEmptyReason({
        datasets: study?.datasets,
        includedCount: filteredDatasetTokens?.length || 0,
      });

  return (
    <div className="header">
      <div className="study">
        <div className="shareStudy">
          <p>
            {t(
              "header.shareInstructions",
              {},
              {
                default:
                  "Share the link below with your participants to invite them to join your study",
              }
            )}
          </p>
          <Tooltip content={copyAria} side="top">
            <CopyButton
              className="studyLink"
              value={studyLink}
              ariaLabel={copyAria}
              title={studyLink}
              style={{
                border: "none",
                background: "#E6E6E6",
                backgroundColor: "#E6E6E6",
              }}
            >
              {studyLink}
            </CopyButton>
          </Tooltip>
          <div className="buttons">
            <div>
              <a target="_blank" href={studyLink} rel="noreferrer">
                <Button variant="outline" type="button">
                  {t("header.testStudy", {}, { default: "Test your study" })}
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="downloadOptions">
          <h3>{t("header.downloadData", "Download data")}</h3>
          <DownloadEmptyNotice reason={emptyReason} />
          {!emptyReason && (
            <DownloadSummaryData
              by="by participant"
              study={study}
              participantsInStudy={participants}
              components={components}
              datasets={study?.datasets || []}
              filteredDatasetTokens={filteredDatasetTokens}
            />
          )}

          {!emptyReason && (
            <DownloadSummaryData
              by=""
              study={study}
              participantsInStudy={participants}
              components={components}
              datasets={study?.datasets || []}
              filteredDatasetTokens={filteredDatasetTokens}
            />
          )}

          {!emptyReason && fileDirs?.length > 0 && (
            <DownloadRawData
              slug={slug}
              fileDirs={fileDirs}
              components={components}
              datasets={study?.datasets || []}
              dataSourceRecords={study?.dataSourceRecords || []}
            />
          )}
        </div>
        <DownloadByComponent
          studyId={study?.id}
          study={study}
          components={components}
          participantsInStudy={participants}
          datasets={study?.datasets || []}
          filteredDatasetTokens={filteredDatasetTokens}
          emptyReason={emptyReason}
        />
      </div>
    </div>
  );
}
