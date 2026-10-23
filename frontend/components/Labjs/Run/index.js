import clonedeep from 'lodash.clonedeep';
import { useEffect, useRef, useState } from 'react';
import { convert } from './functions';
import * as lab from './lib/lab.js';

import Plugin from './Plugin.js';
import { stopExperiment } from './stopExperiment';

const DONE = 3; // lab.js's Status.done, which it doesn't export
const endComponent = lab.core.Component.prototype.end;
lab.core.Component.prototype.end = function end(...args) {
  if (this.status === DONE) return Promise.resolve();
  return endComponent.apply(this, args);
};

// How long a finished run waits on the final save before moving on anyway: a
// transmission that fails outright never calls back.
const SAVE_TIMEOUT = 15000;

const wait = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

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
  // Read when the run finishes instead of being effect dependencies: the
  // parent hands down a new onFinish on every render, and re-running the
  // effect restarts the experiment on the same run token.
  const finishRef = useRef(null);
  finishRef.current = { onFinish, currentStep, isTaskRetaken };
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
    let markSaved;
    const saved = new Promise((resolve) => {
      markSaved = resolve;
    });
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
          // /api/save stores the final result and completes the run.
          callbacks: { full: markSaved },
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

    nextExperiment?.on('end', () => {
      if (!active || completedRef.current) return;
      completedRef.current = true;
      // The final result is transmitted in the epilogue, after this event;
      // leaving before it lands would abort the request. Not awaited here:
      // lab.js waits on 'end' handlers before it runs the epilogue.
      const stored = isSavingData
        ? Promise.race([saved, wait(SAVE_TIMEOUT)])
        : Promise.resolve();
      stored.then(() => {
        const { onFinish, currentStep, isTaskRetaken } = finishRef.current;
        onFinish({
          runToken: runContext?.runToken,
          currentStep,
          isTaskRetaken,
        });
      });
    });

    setExperiment(nextExperiment);
    // Started on the next task, not here: in development React's StrictMode
    // mounts, cleans up and remounts this effect at once, and an experiment
    // started by that first mount is still preparing when it is cleaned up,
    // too early to end. It would run alongside the real one and post a
    // second `full` result for the same run token.
    let started = false;
    const start = setTimeout(() => {
      started = true;
      nextExperiment?.run();
    }, 0);
    return () => {
      active = false;
      clearTimeout(start);
      styleNode?.remove();
      if (started && !completedRef.current) {
        stopExperiment(nextExperiment, lab.plugins.Transmit);
      }
    };
  }, [
    isSavingData,
    parameterSignature,
    runContext?.runToken,
    script,
    style,
  ]);

  if (isPlugin && experiment && !completedRef.current) {
    return <Plugin experiment={experiment} settings={{}} />;
  }
  return null;
}
