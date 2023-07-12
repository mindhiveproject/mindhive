import * as lab from "./lib/lab.js";
// import * as lab from "./libNew/lab.js";
// import * as lab from "./libPlugin/lab.js";
import { convert, decompress } from "./functions.js";
import clonedeep from "lodash.clonedeep";
import Head from "next/head";

import { CREATE_STUDY } from "../../Mutations/Study.js";

export default function ExperimentWindow({ task, user, isSavingData }) {
  // console.log({ task });
  const { template } = task;
  const { script } = template;

  // console.log("process.browser", process.browser);

  // prepare lab.js script
  const labjsObject = convert(script);
  // const delabjsScript = decompress(script);
  // console.log({ labjsObject });

  // get the parameters from MindHive
  Object.assign(
    labjsObject.content[0] && labjsObject.content[0].parameters,
    task?.parameters?.reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {})
  );
  // && isSavingData
  if (labjsObject) {
    labjsObject.plugins = [
      ...labjsObject?.plugins,
      {
        type: "lab.plugins.Transmit",
        // url: `/.netlify/functions/internal/?user=${user}&template=${template}&task=${task}&study=${study}&policy=${policy}&version=${version}&guest=${guest}`,
        url: "/api/save",
        // headers: {
        //   "Content-Type": "application/json",
        // },
        // body: JSON.stringify({
        //   query: CREATE_STUDY,
        //   variables: {
        //     title: "Yury is cool",
        //     description: "Cool cool cool",
        //   },
        // }),
        // callbacks: {},
        // encoding: "graphql",
        // updates: {
        //   incremental: false,
        //   full: true,
        // },
      },
      // {
      //   type: "lab.plugins.NavigationGuard",
      // },
      // {
      //   type: "lab.plugins.Test",
      // },
    ];
  }

  // console.log({ labjsObject });

  // console.log({ lab });

  // old version
  const study = lab?.util?.fromObject(clonedeep(labjsObject), lab);

  // new version
  // const study = lab?.core?.deserialize(labjsObject, lab);

  // console.log(lab.util.fromObject);
  // const study = lab?.core?.deserialize(labjsObject);

  // const study = lab?.core?.deserialize(clonedeep(labjsObject), lab);
  console.log({ study });
  // const study = lab?.core?.deserialize(clonedeep(delabjsScript), lab);
  // const study = lab?.util?.fromObject(clonedeep(labjsScript), lab);

  // launch the task
  study?.run();

  // define the end event
  study?.on("end", () => {
    console.log("The task is over");
  });

  return (
    <div>
      <h2>Loading Experiment</h2>
      <p>The experiment is loading and should start in a few seconds</p>
    </div>
  );
}
