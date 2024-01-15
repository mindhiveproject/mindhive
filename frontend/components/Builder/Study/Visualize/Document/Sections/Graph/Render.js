// https://vega.github.io/vega/docs/api/view/
// https://vega.github.io/vega-lite/docs/
import { Vega } from "react-vega";

export default function Render({ data, spec }) {
  return (
    <div className="graphArea">
      <div className="graph">
        <Vega
          spec={{
            ...spec,
            data: {
              name: "values",
              values: data,
            },
          }}
          actions={{
            export: true,
            source: false,
            compiled: false,
            editor: false,
          }}
          onParseError={(error) => {
            console.log("error", error);
          }}
          onNewView={(view) => {
            // console.log("new view");
          }}
        />
      </div>
    </div>
  );
}
