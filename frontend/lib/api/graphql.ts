import axios from "axios";
import { graphqlEndpoint } from "../../config";

// Server-side alias: API routes read this at runtime (config.js resolves it
// from NEXT_PUBLIC_BACKEND_URL with dev/prod defaults).
export const serverGraphqlUrl = graphqlEndpoint;

export const SAVE_AGGREGATED_RESULTS = `
  mutation createSummaryResult(
    $input: SummaryResultCreateInput!
  ) {
    createSummaryResult(
      data: $input
    ) {
      id
    }
  }
`;

// A server-to-server GraphQL call from an API route. Returns `data`, or throws
// the first GraphQL error's message.
export async function backendGraphql(
  query: string,
  variables: Record<string, unknown>
) {
  const response = await axios.post(
    serverGraphqlUrl,
    { query, variables },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message || "Runtime request failed");
  }
  return response.data.data;
}

// A GraphQL call from an API route made as the browser's user: forwards their
// session cookie, so the backend's access rules apply to them. Returns `data`,
// or throws the first GraphQL error's message.
export async function backendGraphqlAsCaller(
  req: { headers: { cookie?: string } },
  query: string,
  variables: Record<string, unknown>
) {
  const response = await axios.post(
    serverGraphqlUrl,
    { query, variables },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      },
    }
  );
  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message || "Request failed");
  }
  return response.data.data;
}

export const READABLE_DATASET_TOKENS = `
  query READABLE_DATASET_TOKENS($tokens: [String!]!) {
    readableDatasetTokens(tokens: $tokens)
  }
`;

export const CAN_READ_DATASOURCE_FILE = `
  query CAN_READ_DATASOURCE_FILE($datasourceId: ID!, $token: String!) {
    canReadDatasourceFile(datasourceId: $datasourceId, token: $token)
  }
`;
