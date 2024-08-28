import absoluteUrl from "next-absolute-url";
import { useState } from "react";

import debounce from "lodash.debounce";

import DownloadRawData from "../Download/RawData";
import DownloadSummaryData from "../Download/Summary";
import DownloadByComponent from "../Download/ByComponent";

export default function Header({
  keyword,
  updateKeyword,
  study,
  slug,
  participants,
  components,
}) {
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

  const copyLink = () => {
    const copyLink = `${origin}/studies/${slug}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  const debouncedSearch = debounce((value) => {
    // this.setState({
    //   search: value,
    //   page: 1,
    //   guestPage: 1,
    // });
  }, 1000);

  const saveToState = (e) => {
    // this.setState({
    //   [e.target.name]: e.target.value,
    // });
    setKeyword(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="header">
      <div className="study">
        <div className="shareStudy">
          <p>
            Share the link below with your participants to invite them to join
            your study
          </p>
          <h3>
            {origin}/studies/{slug}
          </h3>
          <div className="buttons">
            <div>
              <button onClick={() => copyLink()}>Copy study link</button>
            </div>
            <div>
              <a
                target="_blank"
                href={`${origin}/studies/${slug}`}
                rel="noreferrer"
              >
                <button>Test your study</button>
              </a>
            </div>
          </div>
        </div>
        <div className="downloadOptions">
          <h3>All data in one file</h3>
          {filteredDatasetTokens?.length > 0 && (
            <DownloadSummaryData
              by=""
              study={study}
              participantsInStudy={participants}
              components={components}
              datasets={study?.datasets || []}
              filteredDatasetTokens={filteredDatasetTokens}
            />
          )}

          {filteredDatasetTokens?.length > 0 && (
            <DownloadSummaryData
              by="by participant"
              study={study}
              participantsInStudy={participants}
              datasets={study?.datasets || []}
              filteredDatasetTokens={filteredDatasetTokens}
            />
          )}

          {fileDirs?.length > 0 && (
            <DownloadRawData
              slug={slug}
              fileDirs={fileDirs}
              components={components}
              datasets={study?.datasets || []}
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
        />
      </div>
      <div className="searchArea">
        <input
          type="text"
          name="keyword"
          value={keyword}
          onChange={({ target }) => updateKeyword(target.value)}
          placeholder="Search for participants"
        />
      </div>
    </div>
  );
}
