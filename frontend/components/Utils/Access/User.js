import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  // LIGHT_USER_QUERY,
  CURRENT_USER_QUERY,
  // GET_UPDATES,
} from "../../Queries/User";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";
// import { MY_NOTIFICATIONS } from './Queries/Notification';

// Returns { user, loading }. `loading` distinguishes "not known yet" from
// "logged out" — collapsing both into a null user is what made gated pages
// render the login form before the query resolved.
export function useUser() {
  const { data, loading } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const item = data?.authenticatedItem;

  const user = useMemo(
    () => (item ? { ...item, avatar: getProfileImageUrl(item) } : null),
    [item]
  );

  // cache-and-network reports loading on every background refetch; only the
  // first pass, when there is no answer yet, should hide the page.
  return { user, loading: loading && !item };
}

// export function useLightUser() {
//   const { data } = useQuery(LIGHT_USER_QUERY, {
//     fetchPolicy: "cache-and-network",
//   });
//   if (data?.authenticatedItem) {
//     return {
//       ...data?.authenticatedItem,
//       avatar: data?.authenticatedItem?.image?.image?.publicUrlTransformed,
//     };
//   }
//   return null;
// }

// // fetch new messages, proposals, contracts
// export function FetchUpdates() {
//   const { data } = useQuery(GET_UPDATES, {
//     pollInterval: 30000, // get new data every 30 seconds
//   });
//   if (data?.authenticatedItem) {
//     const incoming = [...data?.authenticatedItem?.updates];
//     return incoming.filter((chunk) => chunk.new);
//   }
//   return [];
// }

// export function MyNotifications() {
//   const { data } = useQuery(MY_NOTIFICATIONS);
//   if (data?.authenticatedItem) {
//     return {
//       ...data?.authenticatedItem,
//     };
//   }
//   return null;
// }
