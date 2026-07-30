// Single source of truth for backend endpoints.
//
// Every value resolves from an environment variable with a default matching
// the standard topology (localhost in dev, mindhive.science in prod), so the
// app runs with no .env file at all. See .env.example for the full list.
//
// NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time —
// changing one requires `next build`, not just a restart. Server-side code
// (pages/api) reads them at runtime.
//
// Dev values are used ONLY when NODE_ENV is explicitly "development": the
// client bundle's NODE_ENV can be undefined outside `next dev`, and falling
// back to localhost in a production bundle is the worse failure mode.
const isDev = process.env.NODE_ENV === "development";

export const backendOrigin =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (isDev ? "http://localhost:4444" : "https://backend.mindhive.science");

export const graphqlEndpoint = `${backendOrigin}/api/graphql`;

// Realtime collaboration (Hocuspocus). Its own process on :4445 in dev; in
// production nginx routes /collaboration on the backend origin to it.

export const collabOrigin =
  process.env.NEXT_PUBLIC_COLLAB_URL ||
  (isDev ? "http://localhost:4445" : backendOrigin);

export const collabWsUrl = `${collabOrigin.replace(/^http/, "ws")}/collaboration`;

// Client-exposed key for the ChatGPT simulation blocks; empty disables them.
export const openAiKey = process.env.NEXT_PUBLIC_OPENAI_KEY || "";
