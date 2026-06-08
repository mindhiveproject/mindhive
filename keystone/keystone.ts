// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config
import "dotenv/config";
import { mkdirSync } from "fs";
import path from "path";
import { config } from "@keystone-6/core";
import depthLimit from "graphql-depth-limit";

import { extendGraphqlSchema } from "./mutations/index";

// to keep this file tidy, we define our schema in a different file
import { lists } from "./schema";

// Collaborative editing (Yjs/Hocuspocus) for ProposalCard rich-text fields
import { createHocuspocusServer } from "./lib/hocuspocus";

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

// Date-partitioned name generator for local file/image storage.
//
// Local storage in Keystone 6 uses fs.writeFile directly and does NOT create
// parent directories, so we mkdirSync(recursive) before returning the path.
//
// Image fields append the detected file extension to whatever the transform
// returns (so it must NOT include the extension), while File fields use the
// returned name verbatim (so it MUST include the extension). One factory,
// two behaviors via `includeExtension`.
const makeDatePartitionedName =
  (storagePath: string, includeExtension: boolean) =>
  (originalFilename: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 10);

    try {
      mkdirSync(path.join(process.cwd(), storagePath, String(year), month), {
        recursive: true,
      });
    } catch {
      // ignore — Keystone will surface a clearer error if write still fails
    }

    const base = `${year}/${month}/${Date.now()}-${rand}`;
    if (!includeExtension) return base;
    const dot = originalFilename.lastIndexOf(".");
    const ext =
      dot >= 0 ? originalFilename.slice(dot + 1).toLowerCase() : "bin";
    return `${base}.${ext}`;
  };

export default withAuth(
  config({
    server: {
      cors: {
        origin: [mhFrontendURL, yqFrontendURL],
        credentials: true,
      },
      // Cookie migration helper: clears old host-only keystonejs-session cookies
      // that were set before the .mindhive.science domain migration (2026-04-15).
      // Those cookies shadow the new domain-wide cookie and cause a login loop.
      // The login page calls GET /api/clear-legacy-session before submitting
      // credentials so the old cookie is gone before iron-session tries to read it.
      // TODO: remove this route after 2026-06-15 (30-day cookie max-age has expired).
      extendExpressApp: (app: any) => {
        app.get("/api/clear-legacy-session", (_req: any, res: any) => {
          res.setHeader(
            "Set-Cookie",
            "keystonejs-session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict",
          );
          res.json({ ok: true });
        });
      },
      // Collaborative editing: route WebSocket upgrades on /collaboration to the
      // Hocuspocus server. Auth is handled inside via the keystonejs-session cookie.
      extendHttpServer: (httpServer: any, commonContext: any) => {
        const { handleUpgrade } = createHocuspocusServer(commonContext);
        httpServer.on("upgrade", (request: any, socket: any, head: any) => {
          if (request.url?.startsWith("/collaboration")) {
            handleUpgrade(request, socket, head);
          }
        });
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
      media_library_exports: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `${assetBaseUrl}/media-library-exports${path}`,
        serverRoute: {
          path: "/media-library-exports",
        },
        storagePath: `media-library-exports`,
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
      opportunity_covers: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${assetBaseUrl}/opportunity-covers${path}`,
        serverRoute: { path: "/opportunity-covers" },
        storagePath: "opportunity-covers",
        transformName: makeDatePartitionedName("opportunity-covers", false),
      },
      opportunity_videos: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `${assetBaseUrl}/opportunity-videos${path}`,
        serverRoute: { path: "/opportunity-videos" },
        storagePath: "opportunity-videos",
        transformName: makeDatePartitionedName("opportunity-videos", true),
      },
    },
  }),
  // ui: {
  //   isAccessAllowed: ({ session }) => {
  //     return permissions.canAccessAdminUI({ session });
  //   },
  // },
);
