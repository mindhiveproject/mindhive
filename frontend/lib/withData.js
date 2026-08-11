import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/link-error";
import { createUploadLink } from "apollo-upload-client";
import withApollo from "next-with-apollo";
import { graphqlEndpoint } from "../config";

function createClient({ initialState }) {
  return new ApolloClient({
    // Without this, hooks rendered during SSR fire network requests nobody
    // awaits. ssrMode makes them report loading instead, which is the state
    // the server is meant to render now that getDataFromTree is gone.
    ssrMode: typeof window === "undefined",
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        if (networkError)
          console.log(
            `[Network error]: ${networkError}. Backend is unreachable. Is it running?`
          );
      }),
      // this uses apollo-link-http under the hood, so all the options here come from that package
      createUploadLink({
        uri: graphqlEndpoint,
        // Keystone's session cookie rides along via credentials; the backend is
        // cross-origin in both dev and prod.
        fetchOptions: {
          credentials: "include",
        },
        headers: {
          "Apollo-Require-Preflight": "true",
        },
      }),
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Assignment: {
          fields: {
            classes: {
              merge(existing = [], incoming = []) {
                // If incoming is empty, return existing
                if (!incoming || incoming.length === 0) {
                  return existing;
                }
                // If existing is empty, return incoming
                if (!existing || existing.length === 0) {
                  return incoming;
                }
                // Merge arrays by combining unique items based on id
                const existingIds = new Set(existing.map(item => item.id));
                const merged = [...existing];
                incoming.forEach(item => {
                  if (!existingIds.has(item.id)) {
                    merged.push(item);
                  }
                });
                return merged;
              }
            }
          }
        }
      }
    }).restore(initialState || {}),
  });
}

// No getDataFromTree on purpose. Server-side rendering the queries meant the
// browser session cookie never reached Keystone, so every SSR pass resolved
// authenticatedItem to null, shipped the login page as HTML, and seeded that
// null into the client cache. Pages now render their loading states on the
// server and resolve in the browser, where the cookie actually exists.
export default withApollo(createClient);
