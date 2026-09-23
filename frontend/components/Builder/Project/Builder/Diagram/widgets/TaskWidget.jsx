import { PortWidget } from '@projectstorm/react-diagrams-core';
import { StyledNode } from '../styles';

import useTranslation from 'next-translate/useTranslation';

import { TASK_TO_PARTICIPATE } from '../../../../../Queries/Task';
import { STUDY_DATA_SOURCES } from '../../../../../Queries/DataSourceBlock';
import { useQuery } from '@apollo/client';

import { RecordDotIcon } from '../../../../../DesignSystem/Icons';

export const TaskWidget = props => {
  const { t } = useTranslation('builder');

   const { data, error, loading } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id: props.node?.options?.componentID },
  });

  // Data sources that run during this block — a source's `scope` is "study"
  // (every block) or { steps: [...] } (only those block ids).
  const studyId = props.engine?.studyId;
  const { data: sourcesData } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId },
    skip: !studyId,
  });
  const blockId = props.node?.options?.id;
  const recordingSources = (sourcesData?.studyDataSources || []).filter(
    source =>
      !Array.isArray(source.scope?.steps) || source.scope.steps.includes(blockId)
  );

  return  (
  <StyledNode taskType={props.node?.options?.taskType}>
    <div
      className="node-header-container"
      id="block"
      style={{ backgroundColor: props.node.color }}
    >
      <div className="node-header-text">
        {data?.task?.title} 
      </div>

      <div className="node-header-icons">
        <div
          className="icon"
          aria-hidden="true"
          id="blockSettings"
          onClick={() => {
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: true,
              isInfoOpen: false,
              isPreviewOpen: false,
            });
          }}
        >
          <img src="/assets/icons/builder/settings.svg" />
        </div>

        <div
          className="icon"
          aria-hidden="true"
          id="blockInfo"
          onClick={() => {
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: false,
              isInfoOpen: true,
              isPreviewOpen: false,
            });
          }}
        >
          <img src="/assets/icons/builder/info.svg" />
        </div>

        <div
          className="icon"
          aria-hidden="true"
          id="blockPlay"
          onClick={() => {
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: false,
              isInfoOpen: false,
              isPreviewOpen: true,
            });
          }}
        >
          <img src="/assets/icons/builder/play.svg" />
        </div>
      </div>
    </div>

    <PortWidget
      className="port-container up-port"
      engine={props.engine}
      port={props.node.getPort('in')}
    >
      <div className="my-in-port"></div>
    </PortWidget>

    <div className="node-content">
      <div>{props.node?.options?.subtitle}</div>
      {recordingSources.length > 0 && (
        <div className="node-recording">
          <RecordDotIcon width={16} height={16} className="node-recording-dot" />
          <span className="node-recording-text">
          {recordingSources.length === 1
            ? t(
                'dataSources.canvas.recordingOne',
                {
                  name:
                    recordingSources[0].label ||
                    recordingSources[0].block?.title,
                },
                { default: 'Recording · {{name}}' }
              )
            : t(
                'dataSources.canvas.recordingMany',
                { count: recordingSources.length },
                { default: 'Recording · {{count}} devices' }
              )}
          </span>
        </div>
      )}
    </div>

    <PortWidget
      className="port-container bottom-port"
      engine={props.engine}
      port={props.node.getPort('out')}
    >
      <div className="my-out-port"></div>
    </PortWidget>
  </StyledNode>
)
} ;
