import { resolveDatasourceSourceSlice } from "../../Helpers/resolveDatasourceSlice";
import { htmlArtifact } from "../widgetArtifact";
import { htmlToPngArtifact } from "./htmlToPngArtifact";
import { buildTableHtmlFromContent } from "./tableHtml";

/**
 * @param {{
 *   content: object;
 *   rect: { width: number; height: number };
 *   journalDatasources: unknown[];
 *   sourceDataByDatasourceId: Record<string, unknown>;
 * }} params
 */
export async function exportTableWidget({
  content,
  rect,
  journalDatasources,
  sourceDataByDatasourceId,
}) {
  const { slice } = resolveDatasourceSourceSlice({
    content,
    journalDatasources,
    sourceDataByDatasourceId,
  });

  const html = buildTableHtmlFromContent(content, slice);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const png = await htmlToPngArtifact(html, width, height);
  if (png) return png;

  return htmlArtifact(html, width, height);
}
