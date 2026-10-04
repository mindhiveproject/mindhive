// Apollo plugin that logs GraphQL operations slower than a threshold, so slow
// queries/mutations reported by users can be found in the production logs:
//
//   [slow-gql] GET_CARD_CONTENT query 1840ms user=clx8f... errors=0
//
// Threshold: SLOW_GQL_MS env var (ms), default 300. Set SLOW_GQL_MS=0 to log
// every operation (useful briefly on staging). Variables are never logged —
// they can contain passwords (authenticateProfileWithPassword) or content.

const thresholdMs = Number(process.env.SLOW_GQL_MS ?? 300);

export const slowOperationLogger = {
  async requestDidStart() {
    const start = Date.now();
    return {
      async willSendResponse({ request, operation, contextValue, errors }: any) {
        const ms = Date.now() - start;
        if (ms < thresholdMs) return;
        const name = request?.operationName || operation?.name?.value || "anonymous";
        const kind = operation?.operation || "unknown";
        const user = contextValue?.session?.itemId ?? "-";
        console.warn(
          `[slow-gql] ${name} ${kind} ${ms}ms user=${user} errors=${errors?.length ?? 0}`,
        );
      },
    };
  },
};
