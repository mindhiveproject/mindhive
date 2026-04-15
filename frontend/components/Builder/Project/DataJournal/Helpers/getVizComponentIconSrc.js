export default function getVizComponentIconSrc(component) {
  const type = component?.type;
  const contentType = component?.content?.type;

  if (type === "HYPVIS") return "/assets/dataviz/headerIcon/hypvis.svg";
  if (type === "PARAGRAPH") return "/assets/dataviz/headerIcon/paragraph.svg";
  if (type === "CODE") return "/assets/dataviz/headerIcon/code.svg";
  if (type === "TABLE") return "/assets/dataviz/headerIcon/table.svg";

  // Statistical test and summary-style components share the table/summary icon.
  if (type === "STATTEST") return "/assets/dataviz/headerIcon/summary.svg";
  if (type === "STATISTICS") return "/assets/dataviz/headerIcon/table.svg";

  if (type === "GRAPH") {
    if (contentType === "barGraph") return "/assets/dataviz/headerIcon/barChart.svg";
    if (contentType === "scatterPlot") return "/assets/dataviz/headerIcon/scatterPlot.svg";
    if (contentType === "histogram") return "/assets/dataviz/headerIcon/stackedBarChart.svg";
    return "/assets/dataviz/headerIcon/defaultGraph.svg";
  }

  return "/assets/dataviz/headerIcon/defaultGraph.svg";
}
