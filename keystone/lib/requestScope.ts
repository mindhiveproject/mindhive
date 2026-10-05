// Per-HTTP-request state that has to be reachable from code with no access to
// the request (Prisma middleware, access helpers). Express middleware enters
// the scope; AsyncLocalStorage carries it through the rest of the request.

import { AsyncLocalStorage } from "async_hooks";

export type RequestScope = {
  req: object;
  dbCount: number;
  dbMs: number;
  slowest: { op: string; ms: number } | null;
};

export const requestScope = new AsyncLocalStorage<RequestScope>();

/** Express middleware: opens the request scope for the rest of the request. */
export function trackRequestScope(req: any, _res: any, next: () => void) {
  requestScope.run({ req, dbCount: 0, dbMs: 0, slowest: null }, next);
}
