import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveDataLimiter } from '../../lib/api/rateLimit';
import { validatePathSegment, assertWithinBase } from '../../lib/api/paths';
import { backendGraphql } from '../../lib/api/graphql';

const {
  labJsGraphqlFinalPayload,
  stampLabJsMetadata,
} = require('../../lib/runtime/labJsCompatibility');
// Shared with /api/runtime/save, which sends the same INGEST_FINAL_MUTATION
// and INGEST_COMPLETE_MUTATION for jsPsych and p5 runs.
const {
  ingestFinalAndComplete,
  loadRunContext,
  runDirectory,
  writeRawResult,
} = require('../../lib/runtime/runResultStore');

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (!saveDataLimiter(req, res)) return;

  const runToken =
    typeof req.query.runToken === 'string' ? req.query.runToken : null;
  if (!runToken) {
    return res
      .status(401)
      .json({ error: 'A server-issued run token is required.' });
  }

  const { metadata = {}, data = [] } = req.body || {};
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata) ||
    !Array.isArray(data)
  ) {
    return res.status(400).json({ error: 'Invalid Lab.js result payload.' });
  }
  const { payload } = metadata;
  try {
    validatePathSegment(payload, 'payload');
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  let runContext;
  try {
    runContext = await loadRunContext(backendGraphql, runToken);
  } catch {
    return res
      .status(401)
      .json({ error: 'The run token is invalid or expired.' });
  }

  let dir;
  try {
    dir = runDirectory({
      dataRoot: path.resolve(process.cwd(), 'data'),
      runContext,
      validatePathSegment,
      assertWithinBase,
    });
  } catch {
    return res.status(401).json({ error: 'The run token is invalid.' });
  }

  const storedBody = {
    ...req.body,
    metadata: stampLabJsMetadata(runContext, metadata),
  };
  try {
    await writeRawResult({ dir, payload, body: storedBody });
  } catch {
    return res
      .status(500)
      .json({ error: 'The raw result could not be stored.' });
  }

  if (payload === 'full') {
    try {
      await ingestFinalAndComplete(
        backendGraphql,
        runToken,
        labJsGraphqlFinalPayload(data)
      );
    } catch (error: any) {
      return res.status(409).json({
        error: error.message || 'The final runtime result could not be stored.',
      });
    }
  }

  return res.status(200).json({
    message: 'The data was sent successfully',
    status: 202,
    statusText: 'it worked',
  });
}
