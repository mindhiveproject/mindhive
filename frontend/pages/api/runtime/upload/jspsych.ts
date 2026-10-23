import path from 'path';
import { serverGraphqlUrl } from '../../../../lib/api/graphql';
import { generalApiLimiter } from '../../../../lib/api/rateLimit';

const {
  CREATE_VERSION_MUTATION,
  createJsPsychUploadHandler,
} = require('../../../../lib/runtime/jspsychUploadHandler');

export const config = {
  api: {
    // The body is the zip itself, read as a stream with its own size limit.
    bodyParser: false,
  },
};

async function graphqlAs(
  query: string,
  variables: Record<string, unknown>,
  cookie: string
) {
  const response = await fetch(serverGraphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors?.length) throw new Error(result.errors[0].message);
  return result.data;
}

// A GraphQL multipart request, so Keystone stores the zip in its
// jspsych_archives storage as it would for an Admin UI upload.
async function createVersion({
  data,
  zip,
  filename,
  cookie,
}: {
  data: Record<string, unknown>;
  zip: Buffer;
  filename: string;
  cookie: string;
}) {
  const form = new FormData();
  form.append(
    'operations',
    JSON.stringify({
      query: CREATE_VERSION_MUTATION,
      variables: { data: { ...data, archive: { upload: null } } },
    })
  );
  form.append('map', JSON.stringify({ 0: ['variables.data.archive.upload'] }));
  form.append('0', new Blob([zip], { type: 'application/zip' }), filename);
  const response = await fetch(serverGraphqlUrl, {
    method: 'POST',
    headers: { Cookie: cookie, 'Apollo-Require-Preflight': 'true' },
    body: form,
  });
  const result = await response.json();
  if (result.errors?.length) throw new Error(result.errors[0].message);
  return result.data.createJsPsychExperiment;
}

const handler = createJsPsychUploadHandler({
  graphql: graphqlAs,
  createVersion,
  assetRoot: path.resolve(process.cwd(), 'runtime-assets', 'jspsych'),
});

export default async function upload(req: any, res: any) {
  if (!generalApiLimiter(req, res)) return undefined;
  return handler(req, res);
}
