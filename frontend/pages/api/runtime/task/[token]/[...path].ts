import path from 'path';

const { verifyAssetToken } = require('../../../../../lib/runtime/assetToken');
const {
  readStoredManifest,
} = require('../../../../../lib/runtime/jspsychArchive');
const {
  createTaskFileHandler,
} = require('../../../../../lib/runtime/taskAssetHandler');

export const config = {
  api: {
    // Media files in an experiment can be larger than Next's 4 MB warning.
    responseLimit: false,
  },
};

export default createTaskFileHandler({
  assetRoot: path.resolve(process.cwd(), 'runtime-assets', 'jspsych'),
  verifyAssetToken: (token: string) => verifyAssetToken(token),
  readManifest: readStoredManifest,
});
