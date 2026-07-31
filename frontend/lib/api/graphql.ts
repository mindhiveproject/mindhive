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
