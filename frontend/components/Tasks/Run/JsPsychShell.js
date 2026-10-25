import { useCallback, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import RuntimeTaskShell, { parameterValues } from './RuntimeTaskShell';

// jsPsych surveys submit forms; same-origin access is never granted.
const SANDBOX = 'allow-scripts allow-forms';

function taskUrl(assetToken, entryPoint, nonce) {
  const file = entryPoint.split('/').map(encodeURIComponent).join('/');
  return `/api/runtime/task/${encodeURIComponent(
    assetToken
  )}/${file}?n=${encodeURIComponent(nonce)}`;
}

/**
 * Runs a jsPsych task: the version's files come from the task route with the
 * pinned jsPsych injected (see RuntimeTaskShell for saving and finishing).
 *
 * @param {object} task - From TASK_TO_PARTICIPATE.
 * @param {string} assetToken - Lets the frame load this version's files.
 */
export default function JsPsychShell({ task, assetToken, ...run }) {
  const { t } = useTranslation('common');
  const { entryPoint } = task.jsPsychExperiment;
  // The task's own values, else the version's defaults.
  const params = useMemo(
    () =>
      parameterValues(
        task?.parameters?.length
          ? task.parameters
          : task?.jsPsychExperiment?.parameters
      ),
    [task]
  );
  const buildSrc = useCallback(
    (nonce) => taskUrl(assetToken, entryPoint, nonce),
    [assetToken, entryPoint]
  );
  return (
    <RuntimeTaskShell
      {...run}
      runtime="JSPSYCH"
      buildSrc={buildSrc}
      sandbox={SANDBOX}
      params={params}
      title={t('runtime.jsPsychFrameTitle', {}, { default: 'jsPsych task' })}
    />
  );
}
