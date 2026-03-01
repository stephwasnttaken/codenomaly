# Codenomaly

A real-time browser multiplayer game inspired by "I'm On Observation Duty." Players find errors in code and guess their types before the bugs overwhelm the codebase.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor, Zustand
- **Backend**: PartyKit (WebSocket-based real-time server)
- **State**: Zustand (client), PartyKit broadcasts (server state)

## Getting Started

### Prerequisites

- Node.js 18+

### Development

**You must run both the PartyKit server and the Vite client.** The client proxies WebSocket traffic to PartyKit; if PartyKit isn’t running, you’ll see `ECONNREFUSED` and the lobby will stay on “Connecting…” with no players.

**Option A – One command (recommended)**  
From the project root:
```bash
npm install
npm run dev
```
This starts PartyKit (port 1999) and the client (port 5173) together.

**Option B – Two terminals**  
1. **Terminal 1 – PartyKit server** (must be running first):
   ```bash
   cd party && npm run dev
   ```
   Server runs at `http://localhost:1999`.

2. **Terminal 2 – Vite client**:
   ```bash
   cd client && npm run dev
   ```
   Client runs at `http://localhost:5173` and proxies `/parties` WebSockets to PartyKit.

3. **Play**:
   - Open http://localhost:5173
   - Create a lobby (choose language and map) or join with a 4-letter code
   - Host starts the game
   - Find errors in the code, select them, and guess the error type
   - Earn currency to buy powerups (e.g., highlight files with errors)
   - Avoid letting 5+ errors accumulate (game over)

### Build

```bash
cd client && npm run build
```

### Deploy

- **Frontend**: Deploy `client/dist` to Vercel, Netlify, or Cloudflare Pages
- **Backend**: `cd party && npx partykit deploy`
- Set `VITE_PARTY_HOST` to your PartyKit deployment URL (e.g. `codenomaly.yourname.partykit.dev`)

## Project Structure

```
codenomaly/
├── client/          # Vite + React frontend
├── party/           # PartyKit server
├── shared/          # Shared types (reference)
└── README.md
```
