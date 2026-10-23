import { backendGraphql } from '../../../../lib/api/graphql';

const { verifyAssetToken } = require('../../../../lib/runtime/assetToken');
const {
  buildP5TaskDocument,
} = require('../../../../lib/runtime/p5TaskDocument');
const {
  createVisualTaskHandler,
} = require('../../../../lib/runtime/taskAssetHandler');

const VISUAL_SOURCE_QUERY = `
  query RuntimeVisualSource($assetToken: String!) {
    runtimeVisualSource(assetToken: $assetToken) {
      name
      role
      language
      content
    }
  }
`;

export default createVisualTaskHandler({
  verifyAssetToken: (token: string) => verifyAssetToken(token),
  loadVisualFiles: async (assetToken: string) =>
    (await backendGraphql(VISUAL_SOURCE_QUERY, { assetToken }))
      .runtimeVisualSource,
  buildDocument: buildP5TaskDocument,
});
