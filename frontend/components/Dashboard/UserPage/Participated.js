import absoluteUrl from "next-absolute-url";
import { Icon } from "semantic-ui-react";
import moment from "moment";
import useTranslation from 'next-translate/useTranslation';

export default function Participated({ query, user, profile }) {
  const { t } = useTranslation('common');
  const { origin } = absoluteUrl();
  const studies = profile?.participantIn || [];

  if (studies?.length === 0) {
    return (
      <div className="empty">
        <div>{t('participated.noStudiesYet', 'The student hasn’t participated in any studies yet.')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerParticipatedStudies">
        <div>
          <span>{t('participated.studyTitle', 'Study title')}</span>
        </div>
        <div>{t('participated.step', 'Step')}</div>
        <div>{t('participated.type', 'Type')}</div>
        <div>{t('participated.name', 'Name')}</div>
        <div>{t('participated.taskSubtitle', 'Task subtitle')}</div>
        <div>{t('participated.taskVersion', 'Task version')}</div>
        <div>{t('participated.condition', 'Condition')}</div>
        <div>{t('participated.started', 'Started')}</div>
        <div>{t('participated.finished', 'Finished')}</div>
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
                          ).format('MM.D.YYYY, h:mma')
                        ) : (
                          <></>
                        )}
                      </div>
                      <div>
                        {test?.timestampFinished ? (
                          moment(test?.timestampFinished).format(
                            'MM.D.YYYY, h:mma'
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
