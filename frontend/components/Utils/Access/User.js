import { useQuery } from "@apollo/client";
import {
  // LIGHT_USER_QUERY,
  CURRENT_USER_QUERY,
  // GET_UPDATES,
} from "../../Queries/User";
// import { MY_NOTIFICATIONS } from './Queries/Notification';

export function useUser() {
  const { data } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  if (data?.authenticatedItem) {
    return {
      ...data?.authenticatedItem,
      avatar: data?.authenticatedItem?.image?.image?.publicUrlTransformed,
    };
  }
  return null;
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
