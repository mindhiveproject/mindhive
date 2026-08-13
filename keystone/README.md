# Keystone Backend
---
The backend was created with [keystone.js](https://keystonejs.com/docs/walkthroughs/getting-started-with-create-keystone-app). 

If you want an overview of all the features Keystone offers, check out keystone's [features](https://keystonejs.com/why-keystone#features) page.

## Environment variables
---
Before running the app, copy [.env.example](./.env.example) to `.env` and fill in
the values:

```
cp .env.example .env
```

## AI Feedback Helper

The `generateAiFeedbackHelp` GraphQL mutation proxies admin-only requests to the local Pydantic service.

- `AI_FEEDBACK_SERVICE_URL`: required for the mutation, for example `http://localhost:8001`.
- `AI_FEEDBACK_SERVICE_TOKEN`: optional shared token. If set here, the Python service must use the same value.

To view the config for your new app, look at [./keystone.ts](./keystone.ts)
`.env` is gitignored because it holds secrets (mail token, Cloudinary
credentials, session secret). The `.env.example` file documents every variable
the backend reads and provides safe defaults for local development.

## Changing the database
---

This app is setup with a local [SQLite database](https://keystonejs.com/docs/apis/config#sqlite) for ease-of-use. If you're wanting to use PostgreSQL for production, you can.

You must set up a Postgres database (e.g., with the [Postgres app](https://postgresapp.com/)) and enter its connection URL as the `DATABASE_URL` variable in the `.env` file in the keystone folder, then set the `NODE_ENV` variable to `production`.
