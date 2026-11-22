# VisitorX — MERN visitor management

VisitorX is a full-stack visitor check-in and campus visitor log built with MongoDB, Express, React, and Node.js.

## Requirements

- Node.js 20 or newer and npm

## Configure and run

1. Copy `server/.env.example` to `server/.env`.
2. Leave `MONGODB_URI` blank to let development mode download and start a local MongoDB process. Its database files stay in `server/.data/mongodb`. Or, set it to a MongoDB Atlas URI.
3. Set `JWT_SECRET` to a private random string with at least 32 characters.
4. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` with at least 12 characters. Do not use the example values in a real deployment.
5. From the project root, run `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
6. Create the staff account with `npm run seed:admin`.
7. Start the app with `npm run dev` from the project root.
8. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The React app uses the Express API at `http://localhost:5000/api` by default. Configure `CLIENT_ORIGIN` on the server if the frontend uses another origin; set `VITE_API_URL` in `client/.env` to change the API URL. The first development launch downloads the MongoDB server binary if it is not already cached.

## Features

- Public visitor check-in with server-side validation and automatic entry time
- Staff login with bcrypt password hashes, expiring JWT sessions, and login rate limiting
- Staff-only visitor list, search, date and status filters, check-out updates, and CSV export
- MongoDB visitor/admin models and summary counts for today's visits
- Responsive check-in and dashboard views

Visitor records are stored in MongoDB. The visitor check-in endpoint is public by design; list, check-out, delete, and staff session endpoints require a valid staff token. Use HTTPS, secure database credentials, regular backups, and an appropriate retention policy before handling real visitor information.
