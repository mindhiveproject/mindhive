import path from 'path';

const {
  createEnvelopeFileHandler,
} = require('../../../../lib/runtime/taskAssetHandler');

export const config = {
  api: {
    // plugin-survey alone is over 1 MB.
    responseLimit: false,
  },
};

export default createEnvelopeFileHandler({
  modulesRoot: path.resolve(process.cwd(), 'node_modules'),
});
