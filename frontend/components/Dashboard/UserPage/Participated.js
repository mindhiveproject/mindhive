import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";

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
        <div>Condition</div>
        <div>Task/survey/block</div>
        <div>Task ID</div>
        <div>Status</div>
        <div>Date</div>
      </div>
      <div>
        {studies.map((study, num) => {
          // get the information this profile has regarding the study
          const studyInfo =
            (profile?.studiesInfo && profile?.studiesInfo[study?.id]) || {};

          // get the condition name
          const blockId = studyInfo?.blockId || undefined;
          // get the condition id
          const blockName = studyInfo?.blockName || undefined;

          let tests = [];
          // if the study has only one block (no between-subjects design), use that block
          if (
            study?.components?.blocks &&
            study?.components?.blocks.length === 1
          ) {
            tests = study?.components?.blocks[0].tests;
          } else {
            // get the study block which is equal to profile condition id
            const studyBlock = study.components?.blocks.filter(
              (block) => block?.blockId === blockId
            )[0];
            // get the tests from this block
            tests = studyBlock?.tests || [];
          }

          const results = profile?.results || [];

          const resultsWithInfo = results
            .filter((result) => result?.study?.id === study?.id)
            .map((result) => {
              const resultExtended = {
                ...result,
                title:
                  tests
                    .filter((test) => test?.testId === result?.testVersion)
                    .map((test) => test?.title) || [],
              };
              return resultExtended;
            });

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
                {blockName}

                <div>
                  {tests.map((test, num) => (
                    <li key={num}>{test?.title}</li>
                  ))}
                </div>
              </div>
              <div>
                {resultsWithInfo?.map((test, num) => (
                  <div className="rowTasks" key={num} odd={num % 2}>
                    <div>
                      {test?.title.map((title, num) => (
                        <span key={num}>{title} </span>
                      ))}
                    </div>
                    <div>{test?.testVersion}</div>

                    <div>
                      {test?.payload ? (
                        <>
                          {test?.payload === "full"
                            ? "✅ Completed "
                            : "🔥 Started"}
                        </>
                      ) : (
                        "❌ Not done"
                      )}
                    </div>
                    <div>
                      {test?.createdAt ? (
                        moment(test?.createdAt).format("MM.D.YYYY, h:mma")
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
