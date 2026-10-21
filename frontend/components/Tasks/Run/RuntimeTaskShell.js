import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import RuntimeFrame from './RuntimeFrame';
import { createRunBuffer } from './runBuffer';
import { createRuntimeSaveClient } from './runtimeSaveClient';

// Same as the Lab.js runner: how long the participant waits for the final
// save before the study moves on regardless.
const SAVE_TIMEOUT = 15000;

const FRAME_BOX = { width: '100%', height: '100vh' };

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Parameter values by name from a Template.parameters-format list. */
export function parameterValues(list) {
  return (list || []).reduce((values, parameter) => {
    if (parameter?.name) values[parameter.name] = parameter.value;
    return values;
  }, {});
}

/**
 * Runs one framed task (jsPsych or p5) as a study step: results travel over
 * the mindhive-runtime/2 bridge into a run buffer, and the study moves on
 * once the full result is saved, or the save times out, as for Lab.js. A
 * crash ends the run with FAILURE and offers Continue.
 *
 * @param {"JSPSYCH" | "P5"} runtime
 * @param {(nonce: string) => string} buildSrc - The task document's URL; a
 *   stable function, since a new identity rebuilds the frame.
 * @param {string} sandbox - Never with `allow-same-origin`.
 * @param {object} params - Parameter values sent in `init`.
 * @param {string} title - Accessible name of the frame.
 * @param {object} [runContext] - From startRun; required when saving.
 * @param {boolean} [isSavingData] - False in preview: nothing is sent (D12).
 */
export default function RuntimeTaskShell({
  runtime,
  buildSrc,
  sandbox,
  params,
  title,
  runContext,
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
      <div role="alert" data-runtime-shell={runtime}>
        <p>
          {t(
            'runtime.taskFailed',
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
    <div data-runtime-shell={runtime} style={FRAME_BOX}>
      <RuntimeFrame
        buildSrc={buildSrc}
        sandbox={sandbox}
        runtime={runtime}
        mode={runToken ? 'persist' : 'preview'}
        params={params}
        autoFocus
        title={title}
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
