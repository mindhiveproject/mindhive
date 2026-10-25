import path from 'path';

const {
  createEnvelopeFileHandler,
  p5File,
} = require('../../../../lib/runtime/taskAssetHandler');

export const config = {
  api: {
    // p5.min.js is over 1 MB.
    responseLimit: false,
  },
};

export default createEnvelopeFileHandler({
  modulesRoot: path.resolve(process.cwd(), 'node_modules'),
  resolveFile: p5File,
});
