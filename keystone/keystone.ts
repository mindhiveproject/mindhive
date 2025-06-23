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

export default withAuth(
  config({
    server: {
      cors: {
        origin: [
          process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL_DEV
            : process.env.FRONTEND_URL,
        ],
        credentials: true,
      },
    },
    // db: {
    //   // we're using sqlite for the fastest startup experience
    //   //   for more information on what database might be appropriate for you
    //   //   see https://keystonejs.com/docs/guides/choosing-a-database#title
    //   provider: "postgresql",
    //   url: process.env.NODE_ENV === "development"
    //       ? process.env.DATABASE_DEV
    //       : process.env.DATABASE_URL,
    // },
    // db: {
    //   provider: 'sqlite',
    //   url: 'file:./keystone.db',
    // },
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
    session,
    // ui: {
    //   isAccessAllowed: ({ session }) => {
    //     return permissions.canAccessAdminUI({ session });
    //   },
    // },
  })
);
