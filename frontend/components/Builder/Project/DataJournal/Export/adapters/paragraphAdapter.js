import { htmlArtifact } from "../widgetArtifact";
import { htmlToPngArtifact } from "./htmlToPngArtifact";

/**
 * @param {{ content: object; rect: { width: number; height: number } }} params
 */
export function buildParagraphHtml({ content }) {
  const text = typeof content?.text === "string" ? content.text : "";
  return text.trim() ? text : "<p></p>";
}

/**
 * @param {{ content: object; rect: { width: number; height: number } }} params
 */
export async function exportParagraphWidget({ content, rect }) {
  const html = buildParagraphHtml({ content });
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const png = await htmlToPngArtifact(html, width, height);
  if (png) return png;

  return htmlArtifact(html, width, height);
}
