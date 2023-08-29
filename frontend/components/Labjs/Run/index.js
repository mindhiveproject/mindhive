import * as lab from "./lib/lab.js";
import { convert, decompress } from "./functions";
import clonedeep from "lodash.clonedeep";
import Head from "next/head";

import Plugin from "./Plugin.js";

import { CREATE_DATASET, UPDATE_DATASET } from "../../Mutations/Dataset.js";

import { useMutation } from "@apollo/client";

export default function ExperimentWindow({
  user,
  study,
  task,
  onFinish,
  isSavingData,
}) {
  console.log({ task });
  // whether to show the plugin is decided by the study parameter
  const isPlugin = study?.settings?.useExternalDevices;

  const [createDataset] = useMutation(CREATE_DATASET, {
    ignoreResults: true, // do not re-render this component
    variables: {
      profileId: user?.id,
      templateId: task?.template?.id,
      taskId: task?.id,
    },
  });

  const [updateDataset] = useMutation(UPDATE_DATASET, {
    ignoreResults: true,
  });

  const { template } = task;
  const { script, style } = template;

  // prepare lab.js script
  const labjsObject = convert(script);

  // get the parameters from MindHive
  Object.assign(
    labjsObject.content[0] && labjsObject.content[0].parameters,
    task?.parameters?.reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {})
  );

  if (labjsObject && isSavingData) {
    labjsObject.plugins = [
      ...labjsObject?.plugins,
      {
        type: "lab.plugins.Transmit",
        url: "/api/save",
      },
      { type: "lab.plugins.Debug" },
    ];
  }

  // construct the experiment
  const experiment = lab?.util?.fromObject(clonedeep(labjsObject), lab);

  // define the start event
  experiment?.on("run", () => {
    if (isSavingData) {
      const id = experiment?.plugins?.plugins
        .map((p) => p?.metadata?.id)
        .filter((p) => !!p)[0];
      // create a new data record by using a mutation
      createDataset({ variables: { token: id } });
    }
  });

  // define the end event
  experiment?.on("end", () => {
    const id = experiment?.plugins?.plugins
      .map((p) => p?.metadata?.id)
      .filter((p) => !!p)[0];
    if (isSavingData) {
      // update the record by mutation (that the task is over)
      updateDataset({ variables: { token: id, isCompleted: true } });
    }
    onFinish({ token: id });
  });

  // css style
  if (style) {
    const styleNode = document.createElement("style");
    const embeddedStyle = style.split("data:text/css,")[1];
    styleNode.innerHTML = window.decodeURIComponent(embeddedStyle);
    document.body.appendChild(styleNode);
    // const labjsElement = document.getElementById("labjs");
    // if (labjsElement) {
    //   labjsElement.appendChild(styleNode);
    // }
  }

  // launch the experiment
  experiment?.run();

  if (isPlugin) {
    return <Plugin experiment={experiment} settings={{}} />;
  }
}
