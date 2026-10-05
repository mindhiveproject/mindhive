// Logging for finding slow requests in production.
//
// [slow-gql] — GraphQL operations slower than SLOW_GQL_MS (default 300), with
// the database work done for them:
//
//   [slow-gql] GET_CARD_CONTENT query 1840ms user=clx8f... errors=0 db=12q/1650ms slowest=Assignment.findMany:1400ms
//
//   db=      number of database queries and their summed time (queries can run
//            in parallel, so the sum may exceed the request time)
//   slowest= the single slowest database query
//   Requests without a session also get page= (Referer path) and ua= (user
//   agent), to tell logged-out visitors and crawlers apart.
//
// [slow-db] — single database queries slower than SLOW_DB_MS (default 200),
// with the shape of their filter (values masked as ?, lists as [n]):
//
//   [slow-db] Assignment.findMany 1400ms where={"AND":[{"id":{"in":[1]}},{"OR":[...]}]}
//
// Failed requests also get error= (first error message, truncated).
//
// Set SLOW_GQL_MS=0 to log every operation (briefly, on staging). Variables
// and filter values are never logged — they can contain passwords or emails.

import { requestScope } from "./requestScope";

const gqlThresholdMs = Number(process.env.SLOW_GQL_MS ?? 300);
const dbThresholdMs = Number(process.env.SLOW_DB_MS ?? 200);

/** Filter shape with values masked, so it can be logged safely. */
function shape(value: any, depth = 0): any {
  if (Array.isArray(value)) {
    return value.length && typeof value[0] === "object" && depth < 8
      ? value.map((v) => shape(v, depth + 1))
      : [value.length];
  }
  if (value && typeof value === "object") {
    if (depth >= 8) return "{…}";
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shape(v, depth + 1)]),
    );
  }
  return "?";
}

/** Prisma middleware: times every query, logs slow ones, feeds dbStats. */
export function attachPrismaTiming(prisma: any) {
  prisma.$use(async (params: any, next: (p: any) => Promise<any>) => {
    const start = Date.now();
    try {
      return await next(params);
    } finally {
      const ms = Date.now() - start;
      const op = `${params.model ?? "raw"}.${params.action}`;
      const stats = requestScope.getStore();
      if (stats) {
        stats.dbCount += 1;
        stats.dbMs += ms;
        if (!stats.slowest || ms > stats.slowest.ms) stats.slowest = { op, ms };
      }
      if (ms >= dbThresholdMs) {
        const where = JSON.stringify(shape(params.args?.where ?? null));
        console.warn(`[slow-db] ${op} ${ms}ms where=${where.slice(0, 600)}`);
      }
    }
  });
}

export const slowOperationLogger = {
  async requestDidStart() {
    const start = Date.now();
    return {
      async willSendResponse({ request, operation, contextValue, errors }: any) {
        const ms = Date.now() - start;
        if (ms < gqlThresholdMs) return;
        const name = request?.operationName || operation?.name?.value || "anonymous";
        const kind = operation?.operation || "unknown";
        const user = contextValue?.session?.itemId ?? "-";
        let line = `[slow-gql] ${name} ${kind} ${ms}ms user=${user} errors=${errors?.length ?? 0}`;
        const stats = requestScope.getStore();
        if (stats) {
          line += ` db=${stats.dbCount}q/${stats.dbMs}ms`;
          if (stats.slowest) line += ` slowest=${stats.slowest.op}:${stats.slowest.ms}ms`;
        }
        if (errors?.length) {
          // Keystone doesn't log GraphQL errors server-side; keep the first
          // message (one line, truncated) so failures can be diagnosed.
          const message = String(errors[0]?.message || "").replace(/\s+/g, " ");
          line += ` error="${message.slice(0, 200)}"`;
        }
        if (user === "-") {
          const headers = contextValue?.req?.headers || {};
          let page = "-";
          try {
            page = headers.referer ? new URL(headers.referer).pathname : "-";
          } catch {}
          const ua = String(headers["user-agent"] || "-").slice(0, 80);
          line += ` page=${page} ua="${ua}"`;
        }
        console.warn(line);
      },
    };
  },
};
