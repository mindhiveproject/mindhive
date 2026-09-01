import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import { TASK_TO_PARTICIPATE } from '../../Queries/Task';
import { START_RUN } from '../../Mutations/Runtime';
import DynamicExperimentWindow from '../../Labjs/Run/Wrapper';
import Labjs from '../../Global/Labjs';
import P5Shell from './P5Shell';
import JsPsychShell from './JsPsychShell';
import { resolveRuntimeConfiguration } from './runtimeConfig';

export default function TaskRun({
  user,
  study,
  id,
  testVersion,
  currentStep,
  isTaskRetaken,
  onFinish,
  isSavingData,
}) {
  const { t } = useTranslation('common');
  const {
    data,
    error: queryError,
    loading,
  } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id },
  });
  const [startRun] = useMutation(START_RUN);
  const [runContext, setRunContext] = useState(null);
  const [startError, setStartError] = useState(null);
  const [script, setScript] = useState(null);
  const startPromise = useRef(null);
  const task = data?.task;

  const resolved = useMemo(() => {
    if (!task) return null;
    try {
      return resolveRuntimeConfiguration(task);
    } catch (configurationError) {
      return { error: configurationError };
    }
  }, [task]);
  const needsPersistedRun =
    !!isSavingData && resolved?.runtimeType === 'LABJS' && !resolved.error;
  const startKey =
    needsPersistedRun && task && study?.id
      ? `${task.id}:${study.id}:${testVersion ?? ''}`
      : null;

  useEffect(() => {
    let cancelled = false;
    if (!startKey) {
      startPromise.current = null;
      return undefined;
    }
    if (startPromise.current?.key !== startKey) {
      setStartError(null);
      setRunContext(null);
      startPromise.current = {
        key: startKey,
        promise: startRun({
          variables: {
            taskId: task.id,
            studyId: study.id,
            requestedTestVersion:
              testVersion == null ? null : String(testVersion),
            guestPublicId: user?.type === 'GUEST' ? user.publicId : null,
          },
        }),
      };
    }
    startPromise.current.promise
      .then((result) => {
        if (!cancelled) setRunContext(result.data.startRun);
      })
      .catch((runError) => {
        if (!cancelled) setStartError(runError);
      });
    return () => {
      cancelled = true;
    };
  }, [
    startKey,
    startRun,
    study?.id,
    task,
    testVersion,
    user?.publicId,
    user?.type,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function fetchLabJsScript() {
      try {
        const response = await fetch(
          `/api/templates/${task.template.slug}/script`
        );
        if (!response.ok) throw new Error('Lab.js script could not be loaded');
        const source = await response.text();
        if (!cancelled) setScript(source);
      } catch (scriptError) {
        if (!cancelled) setStartError(scriptError);
      }
    }
    if (resolved?.runtimeType === 'LABJS' && task?.template?.slug) {
      fetchLabJsScript();
    }
    return () => {
      cancelled = true;
    };
  }, [resolved?.runtimeType, task?.id, task?.template?.slug]);

  const combinedError = queryError || resolved?.error || startError;
  if (combinedError) {
    return (
      <div role="alert">
        {t(
          'runtime.configurationError',
          {},
          {
            default:
              'This task cannot start because its runtime is misconfigured.',
          }
        )}
      </div>
    );
  }
  if (loading || !task || !resolved || (needsPersistedRun && !runContext)) {
    return (
      <div role="status">
        {t('runtime.starting', {}, { default: 'Starting task…' })}
      </div>
    );
  }

  if (resolved.runtimeType === 'P5') return <P5Shell task={task} />;
  if (resolved.runtimeType === 'JSPSYCH') {
    return <JsPsychShell runContext={runContext} />;
  }
  if (!script) {
    return (
      <div role="status">
        {t(
          'runtime.loadingLabJs',
          {},
          {
            default: 'Loading experiment…',
          }
        )}
      </div>
    );
  }

  return (
    <Labjs>
      <DynamicExperimentWindow
        study={study}
        task={{ ...task, template: { ...task.template, script } }}
        runContext={runContext}
        currentStep={currentStep}
        isTaskRetaken={isTaskRetaken}
        onFinish={onFinish}
        isSavingData={isSavingData}
      />
    </Labjs>
  );
}
