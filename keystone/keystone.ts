// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config
import "dotenv/config";
import { config } from "@keystone-6/core";
import depthLimit from "graphql-depth-limit";

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
const assetBaseUrl = baseUrl || "";

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
          : process.env.DATABASE_URL || "",
    },
    lists,
    extendGraphqlSchema,
    graphql: {
      // Issue #11: reduced from 100mb. File uploads go through Cloudinary/local
      // storage routes, not the GraphQL body, so 10mb covers all legitimate queries.
      bodyParser: {
        limit: "10mb",
      },
      // Issue #12 + #13: disable introspection in production and cap query depth.
      apolloConfig: {
        introspection: process.env.NODE_ENV !== "production",
        validationRules: [depthLimit(10)],
      },
    },
    session,
    storage: {
      cover_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${assetBaseUrl}/yq-images${path}`,
        serverRoute: {
          path: "/yq-images",
        },
        storagePath: `yq-visuals/yq-images`,
      },
      p5_visuals: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `${assetBaseUrl}/yq-code${path}`,
        serverRoute: {
          path: "/yq-code",
        },
        storagePath: `yq-visuals/yq-code`,
      },
      media_library_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${assetBaseUrl}/media-library${path}`,
        serverRoute: {
          path: "/media-library",
        },
        storagePath: `media-library`,
      },
      profile_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${assetBaseUrl}/profile-images${path}`,
        serverRoute: {
          path: "/profile-images",
        },
        storagePath: `profile-images`,
      },
      study_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${assetBaseUrl}/study-images${path}`,
        serverRoute: {
          path: "/study-images",
        },
        storagePath: `study-images`,
      },
    },
  })
  // ui: {
  //   isAccessAllowed: ({ session }) => {
  //     return permissions.canAccessAdminUI({ session });
  //   },
  // },
);
