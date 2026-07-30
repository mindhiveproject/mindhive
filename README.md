# MindHive
---
You've stumbled upon the MindHive GitHub repository! This holds the code for the MindHive educational platform. If you wish to try out the platform and experience it for yourself, navigate to our website hosted at [mindhive.science](https://mindhive.science/). If you're a developer wanting to contribute to the project read on! 


## Developing
---

### Forking the repository
---
Before setting up the dev environment, we want to walk you through our preferred method for contributing:
1. Fork the project into your own GitHub repo
2. Clone the forked project from your GitHub to your local repo
3. Set up the project in the local development environment (see below)
4. Make changes in the project
5. Push changes in the local version
   1. git add -A
   2. git commit -m "message explaining the commit"
   3. git push origin branch-name
6. Create a pull request for the main version

### Setting up your local development environment
---
To make this tutorial a bit easier to follow, we've broken it down into multiple steps.

#### Setting up node and npm
---
1. Install node and npm (see [instructions](https://www.npmjs.com/get-npm))
2. You may have to use different node versions for the frontend and backend: the frontend runs on Node 26 and the backend (keystone) on Node 23. To install a specific node version and manage them, you may use the package called [n](https://www.npmjs.com/package/n) or [nvm](https://github.com/nvm-sh/nvm).

#### Installing dependencies
---
3. Run `npm install` in both frontend and keystone folders. If npm complains about dependencies in the frontend folder, use `npm install --legacy-peer-deps`

#### Environmental variables
---
5. (Optional) In the frontend folder, copy `.env.example` to `.env` to customize endpoints or add a `NOTION_KEY` — the defaults work for local development without any `.env` file.
6. In the backend folder, copy [.env.example](./keystone/.env.example) to a `.env` file in that folder and fill in the values.
7. Go to the keystone folder and run `npm run dev` The server should run on [http://localhost:4444](http://localhost:4444/).
8. Go to the frontend folder and run `npm run dev`. The frontend should run on [http://localhost:3000](http://localhost:3000/)


### Production
---
Deploying to production is a different process. For more details, look into the individual README files on the [frontend](./frontend/README.md) and [backend](./keystone/README.md) folders.

## License
---
Shield: [![CC BY-NC-ND 4.0][cc-by-nc-nd-shield]][cc-by-nc-nd]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-NoDerivs 4.0 International License][cc-by-nc-nd].

[![CC BY-NC-ND 4.0][cc-by-nc-nd-image]][cc-by-nc-nd]

[cc-by-nc-nd]: http://creativecommons.org/licenses/by-nc-nd/4.0/
[cc-by-nc-nd-image]: https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png
[cc-by-nc-nd-shield]: https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg
