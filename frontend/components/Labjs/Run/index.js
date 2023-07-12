import * as lab from "./lib/lab.js";
import { convert, decompress } from "./functions";
import clonedeep from "lodash.clonedeep";
import Head from "next/head";

import Plugin from "./Plugin.js";

export default function ExperimentWindow({
  task,
  user,
  isSavingData,
  setStudy,
}) {
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

  if (labjsObject) {
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
    console.log("The task is started");
  });

  // define the end event
  study?.on("end", () => {
    console.log("The task is over");
  });

  // launch the study
  study?.run();

  return <Plugin study={study} settings={{}} />;
}
