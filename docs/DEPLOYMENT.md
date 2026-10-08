# Deployment

Trooper needs a Node.js server and a MySQL database. It cannot run on static hosting.

## Option 1: Docker on your machine (fastest demo)

```bash
docker compose up --build
```

Open http://localhost:3000. The staff dashboard is at `/admin.html` with the token `demo_token`. The first start creates the tables and loads sample data. Later starts skip that step. Data is kept in the `trooper_data` volume. To reset everything, run `docker compose down -v`.

## Option 2: A Node host plus a hosted MySQL

Any host that runs Node 18 or newer and gives you a MySQL database will work. Free tiers and menus change often, so check your provider's current instructions.

1. Create a MySQL database and note its host, port, user, password, and name.
2. Create the web service from your GitHub repo.
3. Build command: `npm ci`
4. Start command: `npm run start:prod`
5. Health check path: `/health`
6. Set these environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | From your database provider |
| `DB_SSL` | `true` if the provider requires TLS |
| `ADMIN_TOKEN` | A long random string (not `demo_token`) |
| `TZ` | `Asia/Manila` or your hospital's time zone |

`npm run start:prod` sets up the tables and sample data on the first run only, then starts the server. It is safe to run on every deploy.

## Option 3: Run the Docker image anywhere

```bash
docker build -t trooper .
docker run -p 3000:3000 --env-file .env trooper
```

Point `DB_HOST` in your `.env` at a reachable MySQL server.

## After deploying

* Visit `/health`. You should see `{"ok":true}`.
* Open `/admin.html` and sign in with your token. Today's list and the message log should load.
* Make a booking in the chatbot and watch the message appear in the log. Texts are printed to the server log until you connect an SMS provider in `services/sms.js`.

## Before sharing the link publicly

* Use a strong `ADMIN_TOKEN`. The dashboard shows patient names.
* Keep the data fake. Do not collect real patient details on a demo.
* Run one instance only, because the notifier and rate limiter live inside the process.
