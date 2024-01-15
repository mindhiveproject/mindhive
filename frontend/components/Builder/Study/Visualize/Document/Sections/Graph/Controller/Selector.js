import { Select } from "semantic-ui-react";

const marks = [
  { label: "Bar plot", value: "bar" },
  { label: "Points", value: "point" },
  { label: "Area", value: "area" },
  { label: "Circle", value: "circle" },
  { label: "Line", value: "line" },
  { label: "Rect", value: "rect" },
  { label: "Rule", value: "rule" },
  { label: "Square", value: "square" },
  { label: "Tick", value: "tick" },
];

export default function Selector({ spec, updateSpec, variables }) {
  const encoding = spec?.encoding || {};
  const { x, y } = encoding;

  const updateSpecEncoding = ({ param1, param2, value }) => {
    updateSpec({
      ...spec,
      encoding: {
        ...spec.encoding,
        [param1]: {
          ...spec.encoding[param1],
          [param2]: value,
        },
      },
    });
  };

  const updateSpecMark = ({ mark }) => {
    updateSpec({
      ...spec,
      mark,
    });
  };

  const options = variables.map((variable) => ({
    key: variable,
    value: variable,
    text: variable,
  }));

  return (
    <div className="selectors">
      <div className="selectorLine">
        <div className="title">X-Axis</div>
        <div className="select">
          <Select
            placeholder="Select your X variable"
            options={options}
            onChange={(e, data) =>
              updateSpecEncoding({
                param1: `x`,
                param2: `field`,
                value: data.value,
              })
            }
          />

          {/* <select
            value={x?.field}
            onChange={(e) =>
              updateSpecEncoding({
                param1: `x`,
                param2: `field`,
                value: e.target.value,
              })
            }
          >
            {["", ...variables].map((value, num) => (
              <option key={num} value={value}>
                {value}
              </option>
            ))}
          </select> */}
        </div>
      </div>
      <div className="selectorLine">
        <div className="title">Y-Axis</div>
        <div className="select">
          <Select
            placeholder="Select your Y variable"
            options={options}
            onChange={(e, data) =>
              updateSpecEncoding({
                param1: `y`,
                param2: `field`,
                value: data.value,
              })
            }
          />
          {/* <select
            value={y?.field}
            onChange={(e) =>
              updateSpecEncoding({
                param1: `y`,
                param2: `field`,
                value: e.target.value,
              })
            }
          >
            {["", ...variables].map((value, num) => (
              <option key={num} value={value}>
                {value}
              </option>
            ))}
          </select> */}
        </div>
      </div>

      <div className="selectorLine">
        <div className="title">Group</div>
        <div className="select">
          <Select
            placeholder="Select your group variable"
            options={options}
            onChange={(e, data) =>
              updateSpecEncoding({
                param1: `color`,
                param2: `field`,
                value: data.value,
              })
            }
          />
        </div>
      </div>

      {/* <div>
        <p>Select type of X variable</p>
        <select
          value={x?.type}
          onChange={(e) =>
            updateSpecEncoding({
              param1: `x`,
              param2: `type`,
              value: e.target.value,
            })
          }
        >
          {["nominal", "ordinal", "quantitative", "temporal"].map(
            (value, num) => (
              <option key={num} value={value}>
                {value}
              </option>
            )
          )}
        </select>
      </div>
      <div>
        <p>Select type of Y variable</p>
        <select
          value={y?.type}
          onChange={(e) =>
            updateSpecEncoding({
              param1: `y`,
              param2: `type`,
              value: e.target.value,
            })
          }
        >
          {["nominal", "ordinal", "quantitative", "temporal"].map(
            (value, num) => (
              <option key={num} value={value}>
                {value}
              </option>
            )
          )}
        </select>
      </div> */}
    </div>
  );
}

{
  /* <StyledSelectorLine>
        <div>
          <label>
            Type of the graph
            <select
              value={spec?.mark}
              onChange={(e) => updateSpecMark({ mark: e.target.value })}
            >
              {marks.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </StyledSelectorLine> */
}
