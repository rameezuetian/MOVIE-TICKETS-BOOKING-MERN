# Movie Ticket Booking App

A movie ticket booking application with a React/Vite client and an Express/MongoDB API. Clerk handles user authentication, TMDB supplies now-playing movie data, Stripe Checkout processes payments, and Inngest runs background jobs such as booking confirmation emails.

## Project layout

```text
client/   React, Vite, and Tailwind frontend
server/   Express API, MongoDB models, Stripe, Clerk, and Inngest
```

## Requirements

- Node.js `20.19+` or `22.12+` (the Vite and Mongoose versions in this project require these versions).
- MongoDB Atlas database
- Clerk application
- TMDB API read access token
- Stripe account for checkout payments
- Inngest account or local Inngest Dev Server
- SMTP account for booking emails (or a Resend API key)

## Configure the server

Create `server/.env` using `server/.env.example` as a template. Fill in the values for your services. Do not commit `.env` files or put server secrets in the frontend.

The server needs these settings:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. The API reads this variable directly. |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication. |
| `TMDB_API_KEY` | TMDB read access token used by the API. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Checkout and webhook verification. |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Inngest event delivery and endpoint signing in production. |
| `CLIENT_URL` | Allowed client origin(s), comma-separated if there are multiple. |
| `EMAIL_FROM` | Sender address for booking emails. |

For Nodemailer SMTP, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASSWORD`. Use the SMTP settings supplied by your email provider. If SMTP is not configured, the email job can use `RESEND_API_KEY` instead. Configure a sender address/domain accepted by that provider.

MongoDB Atlas must allow connections from the server deployment. In Atlas, add the server's outbound IP under **Network Access > IP Access List**. Vercel's outbound addresses can vary; Vercel Static IPs provide stable addresses on supported plans. As a temporary connectivity check, Atlas accepts `0.0.0.0/0`, but that permits connections from any IP, so keep database credentials strong and prefer a restricted allowlist for production.

## Run locally

Install dependencies in each project directory:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

In another terminal:

```powershell
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`. To use a different local API address, set `VITE_API_PROXY` before starting Vite. The backend listens on port `5000` by default and seeds demo movies and upcoming shows after its first database connection.

## Stripe webhooks

The API receives Stripe events at:

```text
POST /api/booking/webhook
```

Configure the Stripe webhook to send `checkout.session.completed` and `checkout.session.async_payment_succeeded` to that endpoint. Set the signing secret from Stripe as `STRIPE_WEBHOOK_SECRET` in the server environment. For local development, use Stripe CLI forwarding and put its generated `whsec_...` secret in `server/.env`.

Booking confirmation emails are queued through Inngest only after payment is confirmed. The Inngest endpoint is `/api/inngest`.

## Deploy to Vercel

This repository contains separate client and server projects. Create a Vercel project for each and set its **Root Directory** accordingly.

### Frontend project

- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variables:
  - `VITE_BASE_URL=https://movie-tickets-booking-mern.vercel.app/api`
  - `VITE_CLERK_PUBLISHABLE_KEY=...`
  - `VITE_CURRENCY=$`

The client Vercel config rewrites app routes to `index.html`, so direct visits to React Router pages work.

### Backend project

- Root Directory: `server`
- Add the server variables listed above in Vercel Project Settings. Local `.env` values are not automatically deployed.
- Set `CLIENT_URL` to the deployed frontend origin.
- In Atlas, allow the backend's outbound IP or configure stable Vercel Static IPs, then allowlist those addresses.
- Set the Stripe webhook destination to `https://movie-tickets-booking-mern.vercel.app/api/booking/webhook`.

Redeploy after changing project settings or environment variables.

## API routes

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/show/all` | Movies with upcoming shows. |
| `GET` | `/api/show/:movieId` | Movie details and upcoming showtimes. |
| `GET` | `/api/show/now-playing` | Current movies from TMDB. |
| `POST` | `/api/show/add` | Add a show (admin only). |
| `GET` | `/api/booking/seats/:showId` | Occupied seats for a show. |
| `POST` | `/api/booking/create` | Reserve seats and create Stripe Checkout. |
| `POST` | `/api/booking/checkout/:bookingId` | Create a payment session for an unpaid booking. |
| `POST` | `/api/booking/confirm` | Confirm the returning user's Stripe session. |
| `POST` | `/api/booking/webhook` | Process signed Stripe payment events. |
| `GET` | `/api/user/bookings` | Signed-in user's bookings. |
| `GET` | `/api/user/favorites` | Signed-in user's favorites. |

## Useful scripts

From `client/`:

```powershell
npm run dev
npm run lint
npm run build
```

From `server/`:

```powershell
npm run dev
npm start
```
