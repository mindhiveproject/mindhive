import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";
import moment from "moment";

export default function Participated({ query, user, profile }) {
  const { origin } = absoluteUrl();
  const studies = profile?.participantIn || [];

  if (studies?.length === 0) {
    return (
      <div className="empty">
        <div>The student hasn’t participated in any studies yet.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerParticipatedStudies">
        <div>
          <span>Study title</span>
        </div>
        <div>Step</div>
        <div>Type</div>
        <div>Name</div>
        <div>Task subtitle</div>
        <div>Task version</div>
        <div>Condition</div>
        <div>Started</div>
        <div>Finished</div>
      </div>
      <div>
        {studies.map((study, num) => {
          const studyInfo =
            (profile?.studiesInfo && profile?.studiesInfo[study?.id]) || {};
          const path = studyInfo?.info?.path || [];

          return (
            <div key={num} className="rowParticipatedStudies">
              <div className="title">
                {study.title}
                <div>
                  <a
                    href={`${origin}/studies/${study.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external alternate" />
                  </a>
                </div>
              </div>
              <div className="conditionName">
                <div>
                  {path.map((test, num) => (
                    <div className="rowTasks" key={num} odd={num % 2}>
                      <div>{test?.type}</div>
                      <div>{test?.taskType}</div>
                      <div>{test?.name}</div>
                      <div>{test?.subtitle}</div>
                      <div>{test?.testId}</div>
                      <div>{test?.conditionLabel}</div>
                      <div>
                        {test?.timestampStarted ||
                        test?.timestampRun ||
                        test?.timestampAssigned ? (
                          moment(
                            test?.timestampStarted ||
                              test?.timestampRun ||
                              test?.timestampAssigned
                          ).format("MM.D.YYYY, h:mma")
                        ) : (
                          <></>
                        )}
                      </div>
                      <div>
                        {test?.timestampFinished ? (
                          moment(test?.timestampFinished).format(
                            "MM.D.YYYY, h:mma"
                          )
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
