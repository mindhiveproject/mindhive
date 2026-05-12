/**
 * When switching `content.datasourceId`, clear column-bound fields so selectors stay valid.
 * @param {string} type — viz section type (GRAPH, STATISTICS, …)
 * @returns {Record<string, unknown>} partial content merged into existing content
 */
export function resetColumnBoundContentForType(type) {
  switch (type) {
    case "GRAPH":
    case "STATISTICS":
    case "HYPVIS":
    case "STATTEST":
      return { selectors: {} };
    case "TABLE":
      return {
        selectors: {
          visibleColumns: [],
          filters: {},
        },
      };
    case "CODE":
      return {};
    default:
      return {};
  }
}
