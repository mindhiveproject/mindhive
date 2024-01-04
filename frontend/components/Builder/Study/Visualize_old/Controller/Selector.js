import styled from "styled-components";

const StyledSelectorLine = styled.div`
  display: grid;
  grid-template-variables: 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-gap: 5px;
  align-items: baseline;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid lightgrey;
`;

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

export default function Selector({ spec, setSpec, variables }) {
  const encoding = spec?.encoding || {};
  const { x, y } = encoding;

  const updateSpecEncoding = ({ param1, param2, value }) => {
    setSpec({
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
    setSpec({
      ...spec,
      mark,
    });
  };

  return (
    <div>
      <StyledSelectorLine>
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
      </StyledSelectorLine>
      <StyledSelectorLine>
        <p>Select X variable</p>
        <select
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
        </select>
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
      </StyledSelectorLine>
      <StyledSelectorLine>
        <p>Select Y variable</p>
        <select
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
        </select>
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
      </StyledSelectorLine>
    </div>
  );
}