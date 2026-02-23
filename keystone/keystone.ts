// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config
import "dotenv/config";
import { config } from "@keystone-6/core";

import { extendGraphqlSchema } from "./mutations/index";

// to keep this file tidy, we define our schema in a different file
import { lists } from "./schema";

// authentication is configured separately here too, but you might move this elsewhere
// when you write your list-level access control functions, as they typically rely on session data
import { withAuth, session } from "./auth";
import { permissions } from "./access";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.ASSET_BASE_URL_DEV
    : process.env.ASSET_BASE_URL;

const yqFrontendURL =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV_YQ
    : process.env.FRONTEND_URL_YQ;

const mhFrontendURL =
  process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL;

export default withAuth(
  config({
    server: {
      cors: {
        origin: [mhFrontendURL, yqFrontendURL],
        credentials: true,
      },
    },
    db: {
      provider:
        process.env.NODE_ENV === "development" ? "sqlite" : "postgresql",
      url:
        process.env.NODE_ENV === "development"
          ? "file:./keystone.db"
          : process.env.DATABASE_URL,
    },
    lists,
    extendGraphqlSchema,
    graphql: {
      bodyParser: {
        limit: "100mb", // Set your desired limit here (e.g., 100MB)
      },
    },
    session,
    storage: {
      cover_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${baseUrl}/yq-images${path}`,
        serverRoute: {
          path: "/yq-images",
        },
        storagePath: `yq-visuals/yq-images`,
      },
      p5_visuals: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `${baseUrl}/yq-code${path}`,
        serverRoute: {
          path: "/yq-code",
        },
        storagePath: `yq-visuals/yq-code`,
      },
    },
  })
  // ui: {
  //   isAccessAllowed: ({ session }) => {
  //     return permissions.canAccessAdminUI({ session });
  //   },
  // },
);
