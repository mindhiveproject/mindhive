import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import MessageCard from '../../DesignSystem/MessageCard';
import RuntimeTaskShell, { parameterValues } from './RuntimeTaskShell';
import { RUNTIME_VISUAL_CONFIG } from '../../Mutations/Runtime';
import { StudySourcesContext } from '../../Studies/Run/DataSources/Main';
import ParameterBus from '../../Visuals/Runtime/parameterBus';
import {
  describeSources,
  subscribeStreams,
} from '../../Visuals/Runtime/useVisualDataSources';
import {
  normalizeDeclarations,
  readBindings,
  resolveValues,
} from '../../Visuals/Helpers/bindings';
import { matchStudySources } from '../../Visuals/Helpers/studySources';

// A sketch draws on a canvas; it needs scripts and nothing more.
const SANDBOX = 'allow-scripts';

const NO_SOURCES = [];

/**
 * Runs a p5 task: the visual's code comes from the visual task route, built
 * into a document with the pinned p5 (see RuntimeTaskShell for saving and
 * finishing). The visual itself may be private: the route gets its code from
 * Keystone with the asset token, so this page never reads it.
 *
 * Inside a study the visual's parameters run as the author bound them. A
 * stream mapping points at one of the visual's own data sources, which here
 * stands for the study's linked source of the same block, so the devices the
 * participant connected at the start of the study drive it. Values reach the
 * frame through a ParameterBus, as in the visual builder.
 *
 * @param {object} task - From TASK_TO_PARTICIPATE.
 * @param {string} assetToken - A p5 asset token for this task's visual.
 */
export default function P5Shell({ task, assetToken, ...run }) {
  const { t } = useTranslation('common');
  const studySources = useContext(StudySourcesContext);
  const [bus] = useState(() => new ParameterBus());
  const [declared, setDeclared] = useState(null);
  const [noticeClosed, setNoticeClosed] = useState(false);

  const { data } = useQuery(RUNTIME_VISUAL_CONFIG, {
    variables: { assetToken },
    skip: !assetToken,
  });
  const config = data?.runtimeVisualConfig;

  // Defaults the task doesn't set come from the sketch's declareParameters.
  const params = useMemo(() => parameterValues(task?.parameters), [task]);
  const bindings = useMemo(
    () => readBindings(config?.parameters).bindings,
    [config]
  );
  const matched = useMemo(
    () => matchStudySources(config?.dataSources, studySources?.rows),
    [config, studySources?.rows]
  );
  const studyRows = useMemo(() => Object.values(matched), [matched]);
  const apis = studySources?.apis;
  const sources = useMemo(
    () => (apis ? describeSources(studyRows, apis) : NO_SOURCES),
    [studyRows, apis]
  );

  const onDeclare = useCallback((raw) => {
    setDeclared(normalizeDeclarations(raw).parameters);
  }, []);

  // The task's own values still win over the author's bindings.
  useEffect(() => {
    if (!declared) return;
    bus.replace({ ...resolveValues(declared, bindings, bus.values), ...params });
  }, [bus, declared, bindings, params]);

  useEffect(() => {
    if (!declared || !apis) return undefined;
    return subscribeStreams(
      bus,
      declared,
      bindings,
      (sourceId) => apis[matched[sourceId]?.id]
    );
  }, [bus, declared, bindings, matched, apis]);

  // Outside a study (a block preview) nothing is connected, so say what the
  // visual would be reading.
  const deviceNames = (config?.dataSources || [])
    .map((source) => source.label || source.block?.title)
    .filter(Boolean)
    .join(', ');
  const notice =
    !studySources && deviceNames && !noticeClosed ? (
      <MessageCard
        variant="information"
        message={t(
          'runtime.visualNeedsDevices',
          { devices: deviceNames },
          {
            default:
              'This visual reacts to data from devices ({{devices}}). Link them to the study so participants connect them before it starts; nothing is connected in preview.',
          }
        )}
        onClose={() => setNoticeClosed(true)}
      />
    ) : null;

  const buildSrc = useCallback(
    (nonce) =>
      `/api/runtime/visual/${encodeURIComponent(
        assetToken
      )}?n=${encodeURIComponent(nonce)}`,
    [assetToken]
  );
  return (
    <RuntimeTaskShell
      {...run}
      runtime="P5"
      buildSrc={buildSrc}
      sandbox={SANDBOX}
      params={params}
      bus={bus}
      sources={sources}
      onDeclare={onDeclare}
      canContinue
      notice={notice}
      title={t('runtime.p5FrameTitle', {}, { default: 'p5 task' })}
    />
  );
}
