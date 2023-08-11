import * as lab from "./lib/lab.js";
import { convert, decompress } from "./functions";
import clonedeep from "lodash.clonedeep";
import Head from "next/head";

import Plugin from "./Plugin.js";

import { CREATE_DATASET, UPDATE_DATASET } from "../../Mutations/Dataset.js";

import { useMutation } from "@apollo/client";

export default function ExperimentWindow({
  user,
  task,
  isSavingData,
  isPlugin,
}) {
  // console.log({ user });

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
  const { script } = template;

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

  // construct the study
  const study = lab?.util?.fromObject(clonedeep(labjsObject), lab);

  // define the start event
  study?.on("run", () => {
    if (isSavingData) {
      const id = study?.plugins?.plugins
        .map((p) => p?.metadata?.id)
        .filter((p) => !!p)[0];
      // create a new data record by using a mutation
      createDataset({ variables: { token: id } });
    }
  });

  // define the end event
  study?.on("end", () => {
    if (isSavingData) {
      const id = study?.plugins?.plugins
        .map((p) => p?.metadata?.id)
        .filter((p) => !!p)[0];
      // update the record by mutation (that the task is over)
      updateDataset({ variables: { token: id, isCompleted: true } });
    }
  });

  // launch the study
  study?.run();

  if (isPlugin) {
    return <Plugin study={study} settings={{}} />;
  }
}
