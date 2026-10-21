# CodeSync Hub

> Real-time collaborative coding and technical interview platform.

## Project Structure

```
CodeSync Hub/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI, navbar, hero, dashboard, auth
│   │   │   ├── auth/         # AuthLayout, FormInput, ProtectedRoute
│   │   │   └── dashboard/    # DashboardLayout, QuickActions, StatsCards, RecentSessions
│   │   ├── context/          # AuthContext (state, login, register, session restore)
│   │   ├── lib/              # API fetch client (credentials & token management)
│   │   ├── pages/            # Home, Login, Signup, Dashboard, Room
│   │   ├── App.jsx           # App routes & ProtectedRoute wrappers
│   │   ├── main.jsx
│   │   └── index.css         # Tailwind v4 theme & base resets
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js        # Tailwind v4 plugin + /api proxy to :5001
│   └── package.json
├── server/                   # Express.js REST API & MongoDB
│   ├── src/
│   │   ├── config/           # MongoDB connection with Mongoose
│   │   ├── controllers/      # authController (register, login, getMe, logout)
│   │   ├── middleware/       # authMiddleware (JWT), errorMiddleware, rateLimitMiddleware
│   │   ├── models/           # User schema (bcrypt hashing, email normalization, safe serialization)
│   │   ├── routes/           # authRoutes (/register, /login, /me, /logout)
│   │   ├── app.js            # Express app with Helmet, CORS, cookies, rate limiting
│   │   ├── server.js         # HTTP server startup & graceful shutdown
│   │   └── index.js          # Main entrypoint
│   ├── test/                 # Automated auth test suite
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

| Tool    | Version  |
| ------- | -------- |
| Node.js | ≥ 18     |
| npm     | ≥ 9      |
| MongoDB | MongoDB Atlas (Cloud) or local MongoDB ≥ 6 |

---

## Setting Up MongoDB Atlas

1. **Create an account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. **Build a cluster:** Create a free **M0 Sandbox** cluster (choose your preferred cloud provider and region).
3. **Database Access (User):**
   - In Atlas left navigation, click **Database Access** under *Security*.
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `codesync_admin`) and generate a secure password.
   - Under *Database User Privileges*, grant **Read and write to any database**.
   - Click **Add User**.
4. **Network Access (IP Whitelist):**
   - Click **Network Access** under *Security*.
   - Click **Add IP Address**.
   - For development, select **Allow Access from Anywhere** (`0.0.0.0/0`) or enter your current IP.
   - Click **Confirm**.
5. **Get Connection String:**
   - In **Database Deployments**, click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/codesync-hub?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the database credentials created in Step 3.
   - Add this value to your `server/.env` as `MONGODB_URI`.

---

## Getting Started Locally

### 1. Backend Setup

```bash
cd "CodeSync Hub/server"

# Create .env from template
cp .env.example .env

# Edit .env and fill in:
# MONGODB_URI=your_atlas_connection_string
# JWT_SECRET=your_random_secret_string

# Install dependencies
npm install

# Run automated auth test suite (runs with in-memory Mongo, no Atlas needed)
npm test

# Start the dev server
npm run dev
```

The API server runs on **http://localhost:5001** (or port 5000 if AirPlay is disabled).  
Check health status:

```bash
curl http://localhost:5001/api/health
```

### 2. Frontend Setup

In a separate terminal:

```bash
cd "CodeSync Hub/client"

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open **http://localhost:5173** in your browser.  
Requests to `/api/*` are automatically proxied to the backend on `:5001`.

---

## Authentication Features

- **Secure Password Hashing:** Uses `bcryptjs` with salt rounds 10. Passwords are never stored in plaintext and never returned in API responses.
- **Dual Token Strategy:** Issues standard JWTs stored in **HTTP-only, secure-in-production cookies** (`SameSite: lax/none`) while also supporting `Authorization: Bearer <token>` headers.
- **Rate Limiting:** Protects `/api/auth/register` and `/api/auth/login` against brute force and credential stuffing attacks via `express-rate-limit`.
- **Protected Routes:** `/dashboard` and `/room/:roomId` require authentication. Unauthenticated requests automatically redirect to `/login`.
- **Session Restoration:** On refresh, the client verifies authentication state via `GET /api/auth/me`.
- **Account Enumeration Defense:** Login failures return generic *"Invalid email or password"* responses.

---

## Available Scripts

### Client (`client/`)
| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start Vite dev server        |
| `npm run build`   | Production build             |
| `npm run preview` | Preview production build     |
| `npm run lint`    | Run linter                   |

### Server (`server/`)
| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start with auto-restart (`--watch`)  |
| `npm start`       | Start in production mode             |
| `npm test`        | Run automated auth verification suite|

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Frontend         | React 19, Vite 8, Tailwind v4, React Router |
| State            | React Context (`AuthContext`)             |
| Icons            | Lucide React                              |
| Backend          | Node.js, Express 5, Helmet, CORS          |
| Security         | JWT, bcryptjs, express-rate-limit         |
| Database         | MongoDB Atlas with Mongoose               |

## License

MIT
