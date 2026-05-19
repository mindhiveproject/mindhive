import { DATA_TOOL_CANVA_CREATED_WITH } from "./constants";

export function isDataToolCanvaAsset(asset) {
  const createdWith = asset?.settings?.createdWith;
  return createdWith === DATA_TOOL_CANVA_CREATED_WITH;
}

export function resolveMediaAssetExportDocumentUrl(asset) {
  return asset?.exportDocument?.url || null;
}
