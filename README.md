# CodeSync Hub

> Real-time collaborative coding and technical interview platform.

## Project Structure

```
CodeSync Hub/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── lib/     # Shared utilities (API client, etc.)
│   │   ├── pages/   # Route-level page components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/          # Express.js API backend
│   ├── src/
│   │   └── index.js
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
| MongoDB | ≥ 6 (needed in later steps) |

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "CodeSync Hub"
```

### 2. Set up the backend

```bash
cd server
cp .env.example .env   # then edit .env with your real values
npm install
npm run dev
```

The API server will start on **http://localhost:5001**.  
Verify it's running:

```bash
curl http://localhost:5001/api/health
```

### 3. Set up the frontend

Open a **new terminal**:

```bash
cd client
cp .env.example .env   # optional — defaults work for local dev
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**.  
API requests to `/api/*` are automatically proxied to the backend during development.

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
| `npm run dev`     | Start with auto-restart (--watch)    |
| `npm start`       | Start in production mode             |

## Environment Variables

See the `.env.example` files in each directory for the full list of required variables.

> ⚠️ **Never commit `.env` files.** They are excluded via `.gitignore`.

## Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Frontend         | React 19, Vite 8, Tailwind v4  |
| Routing          | React Router                   |
| Icons            | Lucide React                   |
| Code Editor      | Monaco Editor (coming soon)    |
| Backend          | Node.js, Express 5             |
| Database         | MongoDB + Mongoose             |
| Real-time        | Socket.IO                      |
| Auth             | JWT + bcrypt                   |
| Video            | WebRTC                         |
| Code Execution   | Judge0 API                     |

## License

MIT
