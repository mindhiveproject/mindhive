// pm2 config for the Next.js frontend.
//
// Start it (from the frontend/ directory) with:
//   pm2 start ecosystem.config.js
//   pm2 save                       # persist across reboots
//
// Cluster mode with two instances lets `pm2 reload mindhive-frontend` (run by
// the deploy workflow) restart them one at a time, so the site stays up
// during a deploy. `next start` binds the port before the app has loaded and
// queues requests until it is ready, so pm2 can hand over as soon as the new
// instance is listening.
//
// Cluster workers run on the pm2 daemon's own Node binary, not the one in
// PATH: after a Node upgrade, restart the daemon (`pm2 update`).
//
// Server-side env (NOTION_KEY etc.) is loaded by Next from frontend/.env.
module.exports = {
  apps: [
    {
      name: "mindhive-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
