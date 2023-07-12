### To participate in development

1. Fork the project into your own GitHub repo
2. Clone the forked project from your GitHub to your local repo
3. Set up the project in the local development environment (see below)
4. Make changes in the project
5. Push changes in the local version
   1. git add -A
   2. git commit -m "message explaining the commit"
   3. git push origin branch-name
6. Create a pull request for the main version

For more information, see Working with GIT below.

### Set up the project in the local development environment

1. Install node and npm (see [instructions](https://www.npmjs.com/get-npm))
2. Use node version `16.18.0`. To install this node version use the package called [n](https://www.npmjs.com/package/n).
3. Run `npm install` in both frontend and keystone folders. If npm complains about dependencies in the frontend folder, use `npm install --legacy-peer-deps`
4. Set up a local Postgres database (e.g., with the [Postgres app](https://postgresapp.com/)) and enter the URL endpoint as the DATABASE_DEV variable in the file ".env" in the keystone folder.
5. Go to the keystone folder and run `npm run dev` The server should run on [http://localhost:4444](http://localhost:4444/)
6. Go to the frontend folder and run `node server.js`. The frontend should run on [http://localhost:3000](http://localhost:3000/)
