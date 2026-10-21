import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import RuntimeFrame from './RuntimeFrame';
import { createRunBuffer } from './runBuffer';
import { createRuntimeSaveClient } from './runtimeSaveClient';

// Same as the Lab.js runner: how long the participant waits for the final
// save before the study moves on regardless.
const SAVE_TIMEOUT = 15000;
// jsPsych surveys submit forms; same-origin access is never granted.
const SANDBOX = 'allow-scripts allow-forms';

const FRAME_BOX = { width: '100%', height: '100vh' };

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Task parameter values by name: the task's own, else the version's defaults. */
function parameterValues(task) {
  const list = task?.parameters?.length
    ? task.parameters
    : task?.jsPsychExperiment?.parameters || [];
  return list.reduce((values, parameter) => {
    if (parameter?.name) values[parameter.name] = parameter.value;
    return values;
  }, {});
}

function taskUrl(assetToken, entryPoint, nonce) {
  const file = entryPoint.split('/').map(encodeURIComponent).join('/');
  return `/api/runtime/task/${encodeURIComponent(
    assetToken
  )}/${file}?n=${encodeURIComponent(nonce)}`;
}

/**
 * Runs a jsPsych task: the version's files come from the task route with the
 * pinned jsPsych injected, results travel over the mindhive-runtime/2 bridge,
 * and the study moves on once the full result is saved (or the save times
 * out, as for Lab.js).
 *
 * @param {object} task - From TASK_TO_PARTICIPATE.
 * @param {object} [runContext] - From startRun; required when saving.
 * @param {string} assetToken - Lets the frame load this version's files.
 * @param {boolean} [isSavingData] - False in preview: nothing is sent (D12).
 */
export default function JsPsychShell({
  task,
  runContext,
  assetToken,
  isSavingData,
  onFinish,
  currentStep,
  isTaskRetaken,
}) {
  const { t } = useTranslation('common');
  const [state, setState] = useState('running');
  const doneRef = useRef(false);
  const finishRef = useRef(null);
  finishRef.current = { onFinish, currentStep, isTaskRetaken };

  const { entryPoint } = task.jsPsychExperiment;
  const params = useMemo(() => parameterValues(task), [task]);
  const runToken = isSavingData ? runContext?.runToken : null;

  const { client, buffer } = useMemo(() => {
    if (!runToken) {
      return {
        client: null,
        buffer: createRunBuffer({ save: async () => {} }),
      };
    }
    const saveClient = createRuntimeSaveClient({ runToken });
    return {
      client: saveClient,
      buffer: createRunBuffer({
        save: saveClient.save,
        beacon: saveClient.beacon,
      }),
    };
  }, [runToken]);

  useEffect(() => {
    const onPageHide = () => buffer.flushOnUnload();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      buffer.dispose();
    };
  }, [buffer]);

  const buildSrc = useCallback(
    (nonce) => taskUrl(assetToken, entryPoint, nonce),
    [assetToken, entryPoint]
  );

  const complete = useCallback(() => {
    const {
      onFinish: finish,
      currentStep: step,
      isTaskRetaken: retaken,
    } = finishRef.current;
    finish?.({ runToken, currentStep: step, isTaskRetaken: retaken });
  }, [runToken]);

  const handleFinish = useCallback(
    (result) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setState('saving');
      const stored = runToken
        ? Promise.race([
            buffer.finish(result).catch(() => {}),
            wait(SAVE_TIMEOUT),
          ])
        : Promise.resolve();
      stored.then(complete);
    },
    [buffer, complete, runToken]
  );

  const handleFailure = useCallback(
    ({ message }) => {
      if (doneRef.current) return;
      doneRef.current = true;
      buffer.dispose();
      // The run ends with FAILURE; a retake starts a new Dataset.
      client?.fail(message).catch(() => {});
      setState('failed');
    },
    [buffer, client]
  );

  if (state === 'failed') {
    return (
      <div role="alert" data-runtime-shell="JSPSYCH">
        <p>
          {t(
            'runtime.jsPsychFailed',
            {},
            {
              default:
                'This task stopped because of an error. Your earlier answers in this study are saved.',
            }
          )}
        </p>
        <button type="button" onClick={complete}>
          {t('runtime.continue', {}, { default: 'Continue' })}
        </button>
      </div>
    );
  }

  return (
    <div data-runtime-shell="JSPSYCH" style={FRAME_BOX}>
      <RuntimeFrame
        buildSrc={buildSrc}
        sandbox={SANDBOX}
        runtime="JSPSYCH"
        mode={runToken ? 'persist' : 'preview'}
        params={params}
        autoFocus
        title={t('runtime.jsPsychFrameTitle', {}, { default: 'jsPsych task' })}
        onRows={(rows) => buffer.addRows(rows)}
        onMarker={(marker) => buffer.addMarker(marker)}
        onFinish={handleFinish}
        onFailure={handleFailure}
      />
      {state === 'saving' && (
        <p role="status">
          {t(
            'runtime.savingResults',
            {},
            { default: 'Saving your responses…' }
          )}
        </p>
      )}
    </div>
  );
}
