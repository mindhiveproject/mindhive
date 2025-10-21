import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/link-error";
import { getDataFromTree } from "@apollo/client/react/ssr";
import { createUploadLink } from "apollo-upload-client";
import withApollo from "next-with-apollo";
import { endpoint, prodEndpoint } from "../config";

function createClient({ headers, initialState }) {
  return new ApolloClient({
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
        uri: process.env.NODE_ENV === "development" ? endpoint : prodEndpoint,
        fetchOptions: {
          credentials: "include",
        },
        headers: {
          cookies: headers?.cookies,
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

export default withApollo(createClient, { getDataFromTree });
