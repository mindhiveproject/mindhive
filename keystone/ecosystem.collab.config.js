// pm2 config for the standalone collaboration server.
//
// Start it (from the keystone/ directory) with:
//   pm2 start ecosystem.collab.config.js
//   pm2 save                       # persist across reboots
//
// DATABASE_URL and SESSION_SECRET are read from keystone/.env by the script
// itself (via `require("dotenv/config")`), so they don't need to be repeated
// here — they must match what the Keystone API process uses.
module.exports = {
  apps: [
    {
      name: "mindhive-collab",
      script: "collab-server.js",
      cwd: __dirname,
      instances: 1, // MUST be 1 (single-process Yjs state; no cluster mode)
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        COLLAB_PORT: 4445,
      },
    },
  ],
};
