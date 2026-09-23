import path from 'path';
import fs from 'fs';
import jsonfile from 'jsonfile';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveDataLimiter } from '../../lib/api/rateLimit';
import { validatePathSegment, assertWithinBase } from '../../lib/api/paths';
import { serverGraphqlUrl } from '../../lib/api/graphql';

const {
  labJsGraphqlFinalPayload,
  stampLabJsMetadata,
} = require('../../lib/runtime/labJsCompatibility');

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' },
  },
};

const RUN_CONTEXT_QUERY = `
  query RuntimeRunContext($runToken: String!) {
    runtimeRunContext(runToken: $runToken) {
      datasetToken
      runtimeType
      testVersion
      studyVersion
      assetId
      assetVersion
      participantType
      participantPublicId
      studyId
      taskId
      templateId
    }
  }
`;

const INGEST_FINAL_MUTATION = `
  mutation IngestLabJsFinal(
    $runToken: String!
    $data: JSON
    $aggregated: JSON
  ) {
    ingestRunMessage(
      runToken: $runToken
      sequence: 1
      messageType: FINAL
      data: $data
      aggregated: $aggregated
    ) {
      accepted
      duplicate
      datasetToken
    }
  }
`;

const INGEST_COMPLETE_MUTATION = `
  mutation IngestLabJsComplete($runToken: String!) {
    ingestRunMessage(
      runToken: $runToken
      sequence: 2
      messageType: COMPLETE
    ) {
      accepted
      duplicate
      datasetToken
    }
  }
`;

async function backendGraphql(
  query: string,
  variables: Record<string, unknown>
) {
  const response = await axios.post(
    serverGraphqlUrl,
    { query, variables },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  if (response.data?.errors?.length) {
    throw new Error(
      response.data.errors[0].message || 'Runtime request failed'
    );
  }
  return response.data.data;
}

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
    const result = await backendGraphql(RUN_CONTEXT_QUERY, { runToken });
    runContext = result.runtimeRunContext;
  } catch {
    return res
      .status(401)
      .json({ error: 'The run token is invalid or expired.' });
  }

  const curDate = new Date();
  const year = String(curDate.getFullYear());
  const month = String(curDate.getMonth() + 1);
  const day = String(curDate.getDate());
  const { datasetToken } = runContext;
  try {
    validatePathSegment(datasetToken, 'dataset token');
  } catch {
    return res.status(401).json({ error: 'The run token is invalid.' });
  }

  const dirData = path.resolve(process.cwd(), 'data');
  const dir = path.resolve(dirData, year, month, day, datasetToken);
  try {
    assertWithinBase(dir, dirData);
  } catch {
    return res.status(400).json({ error: 'Invalid data path.' });
  }
  const filePath = path.join(dir, `${payload}.json`);
  const storedBody = {
    ...req.body,
    metadata: stampLabJsMetadata(runContext, metadata),
  };

  try {
    await fs.promises.mkdir(dir, { recursive: true });
    if (payload === 'modified') {
      await jsonfile.writeFile(filePath, storedBody);
    } else {
      await jsonfile.writeFile(filePath, storedBody, {
        flag: payload === 'full' ? 'wx' : 'a',
        EOL: ',\n',
      } as any);
    }
  } catch (error: any) {
    if (!(payload === 'full' && error?.code === 'EEXIST')) {
      return res
        .status(500)
        .json({ error: 'The raw result could not be stored.' });
    }
  }

  if (payload === 'full') {
    const finalResult = labJsGraphqlFinalPayload(data);
    try {
      await backendGraphql(INGEST_FINAL_MUTATION, {
        runToken,
        data: finalResult.data,
        aggregated: finalResult.aggregated,
      });
      await backendGraphql(INGEST_COMPLETE_MUTATION, { runToken });
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
