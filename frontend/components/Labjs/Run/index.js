import clonedeep from 'lodash.clonedeep';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { convert } from './functions';
import * as lab from './lib/lab.js';

import Plugin from './Plugin.js';
import { INGEST_RUN_MESSAGE } from '../../Mutations/Runtime';

const wait = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function stopExperiment(experiment) {
  const timelineItems = experiment?.internals?.timeline?.items;
  const canEnd =
    typeof experiment?.end === 'function' && Array.isArray(timelineItems);
  if (!canEnd) return;
  Promise.resolve(experiment.end()).catch(() => {});
}

export default function ExperimentWindow({
  study,
  task,
  runContext,
  currentStep,
  isTaskRetaken,
  onFinish,
  isSavingData,
}) {
  const [experiment, setExperiment] = useState(null);
  const completedRef = useRef(false);
  const [ingestRunMessage] = useMutation(INGEST_RUN_MESSAGE);
  const isPlugin = study?.settings?.useExternalDevices;
  const script = task?.template?.script;
  const style = task?.template?.style;
  const parameters = task?.parameters;
  const parameterSignature = Array.isArray(parameters)
    ? JSON.stringify(parameters.map((item) => [item?.name, item?.value]))
    : '';

  useEffect(() => {
    if (!script) return undefined;
    let active = true;
    completedRef.current = false;
    const labjsObject = convert(script);
    Object.assign(
      labjsObject.content[0] && labjsObject.content[0].parameters,
      parameters?.reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {})
    );

    if (labjsObject && isSavingData) {
      if (!runContext?.runToken) {
        throw new Error('A persisted Lab.js run requires a run token');
      }
      const runToken = encodeURIComponent(runContext.runToken);
      labjsObject.plugins = [
        ...(labjsObject.plugins || []),
        {
          type: 'lab.plugins.Transmit',
          url: `/api/save?runToken=${runToken}`,
        },
        { type: 'lab.plugins.Debug' },
      ];
    }

    const nextExperiment = lab?.util?.fromObject(clonedeep(labjsObject), lab);
    let styleNode;
    if (style) {
      styleNode = document.createElement('style');
      const embeddedStyle = style.split('data:text/css,')[1];
      styleNode.innerHTML = window.decodeURIComponent(embeddedStyle);
      document.body.appendChild(styleNode);
    }

    nextExperiment?.on('end', async () => {
      if (!active || completedRef.current) return;
      completedRef.current = true;
      if (isSavingData && runContext?.runToken) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            await ingestRunMessage({
              variables: {
                runToken: runContext.runToken,
                sequence: 2,
                messageType: 'COMPLETE',
              },
            });
            break;
          } catch {
            await wait(200 * (attempt + 1));
          }
        }
      }
      onFinish({
        token: runContext?.datasetToken,
        runToken: runContext?.runToken,
        currentStep,
        isTaskRetaken,
      });
    });

    setExperiment(nextExperiment);
    nextExperiment?.run();
    return () => {
      active = false;
      styleNode?.remove();
      stopExperiment(nextExperiment);
    };
  }, [
    currentStep,
    ingestRunMessage,
    isSavingData,
    isTaskRetaken,
    onFinish,
    parameterSignature,
    runContext?.datasetToken,
    runContext?.runToken,
    script,
    style,
  ]);

  if (isPlugin && experiment && !completedRef.current) {
    return <Plugin experiment={experiment} settings={{}} />;
  }
  return null;
}
