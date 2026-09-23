import dynamic from "next/dynamic";

const importLabjs = () => import("./index");

const DynamicLabjs = dynamic(importLabjs, {
  ssr: false,
});

export default function DynamicExperimentWindow(props) {
  return (
    <>
      <DynamicLabjs {...props} />
      <div className="container fullscreen" data-labjs-section="main">
        <main className="content-vertical-center content-horizontal-center">
          <div>
            <h2>Loading Experiment</h2>
            <p>The experiment is loading and should start in a few seconds</p>
          </div>
        </main>
      </div>
    </>
  );
}
