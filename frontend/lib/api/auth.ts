import axios from "axios";
import type { NextApiRequest } from "next";
import { serverGraphqlUrl } from "./graphql";

// Verify the caller has an active Keystone session by forwarding their cookie.
export async function isAuthenticated(req: NextApiRequest): Promise<boolean> {
  try {
    const response = await axios({
      method: "post",
      url: serverGraphqlUrl,
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      data: JSON.stringify({
        query: "{ authenticatedItem { ... on Profile { id } } }",
      }),
    });
    return !!response.data?.data?.authenticatedItem?.id;
  } catch {
    return false;
  }
}
