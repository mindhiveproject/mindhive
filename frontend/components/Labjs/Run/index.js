import clonedeep from 'lodash.clonedeep';
import { useEffect, useRef, useState } from 'react';
import { convert } from './functions';
import * as lab from './lib/lab.js';

import Plugin from './Plugin.js';

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

function stopExperiment(experiment) {
  const timelineItems = experiment?.internals?.timeline?.items;
  const canEnd =
    typeof experiment?.end === 'function' && Array.isArray(timelineItems);
  if (!canEnd) return;
  // Ending runs lab.js's epilogue, where Transmit would store whatever was
  // collected so far as the run's final result. An abandoned run has none.
  experiment.plugins.plugins
    .filter((plugin) => plugin instanceof lab.plugins.Transmit)
    .forEach((plugin) => experiment.plugins.remove(plugin));
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
    nextExperiment?.run();
    return () => {
      active = false;
      styleNode?.remove();
      if (!completedRef.current) stopExperiment(nextExperiment);
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
