import path from 'path';
import { runtimeSaveLimiter } from '../../../lib/api/rateLimit';
import { validatePathSegment, assertWithinBase } from '../../../lib/api/paths';
import { backendGraphql } from '../../../lib/api/graphql';

const {
  createRuntimeSaveHandler,
} = require('../../../lib/runtime/runtimeSaveHandler');

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
};

export default createRuntimeSaveHandler({
  graphql: backendGraphql,
  dataRoot: path.resolve(process.cwd(), 'data'),
  validatePathSegment,
  assertWithinBase,
  limiter: runtimeSaveLimiter,
});
