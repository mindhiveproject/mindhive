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

`.env` is gitignored because it holds secrets (mail token, Cloudinary
credentials, session secret). The `.env.example` file documents every variable
the backend reads and provides safe defaults for local development.

## Changing the database
---

This app is setup with a local [SQLite database](https://keystonejs.com/docs/apis/config#sqlite) for ease-of-use. If you're wanting to use PostgreSQL for production, you can.

You must set up a Postgres database (e.g., with the [Postgres app](https://postgresapp.com/)) and enter its connection URL as the `DATABASE_URL` variable in the `.env` file in the keystone folder, then set the `NODE_ENV` variable to `production`.
