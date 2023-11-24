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
  testVersion,
  onFinish,
  isSavingData,
}) {
  console.log({ user, study, task });
  // whether to show the plugin is decided by the study parameter
  const isPlugin = study?.settings?.useExternalDevices;
  // check the type of the user
  const userType = user?.type === "GUEST" ? "guest" : "user";

  // todo write a custom creatInputObject where the user id depends on the type of the user
  // datasets should be also  marked with a type: GUEST or USER
  const [createDataset] = useMutation(CREATE_DATASET, {
    ignoreResults: true, // do not re-render this component
    // variables: {},
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

  // get the current date for data saving
  const curDate = new Date();
  const date = {
    year: parseInt(curDate.getFullYear()),
    month: parseInt(curDate.getMonth()) + 1,
    day: parseInt(curDate.getDate()),
  };
  const dateString = `${date.year}-${date.month}-${date.day}`;

  if (labjsObject && isSavingData) {
    labjsObject.plugins = [
      ...labjsObject?.plugins,
      {
        type: "lab.plugins.Transmit",
        url: `/api/save/?st=${study?.id}&te=${task?.template?.id}&ta=${task?.id}&us=${user?.id}&type=${userType}&y=${date.year}&m=${date.month}&d=${date.day}&v=${testVersion}&upid=${user?.publicId}`,
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
      createDataset({
        variables: {
          input: {
            profile:
              user?.type === "GUEST" ? null : { connect: { id: user?.id } },
            guest:
              user?.type === "GUEST"
                ? { connect: { publicId: user?.publicId } }
                : null,
            template: { connect: { id: task?.template?.id } },
            task: { connect: { id: task?.id } },
            study: { connect: { id: study?.id } },
            token: id,
            type: user?.type,
            date: dateString,
            testVersion: testVersion,
          },
        },
      });
    }
  });

  // define the end event
  experiment?.on("end", async () => {
    const id = experiment?.plugins?.plugins
      .map((p) => p?.metadata?.id)
      .filter((p) => !!p)[0];
    if (isSavingData) {
      // update the record by mutation (that the task is over)
      await updateDataset({
        variables: { token: id, isCompleted: true, completedAt: new Date() },
      });
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
