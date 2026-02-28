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

1. **Start the PartyKit server** (terminal 1):
   ```bash
   cd party && npm run dev
   ```
   The server runs at `http://localhost:1999`.

2. **Start the Vite client** (terminal 2):
   ```bash
   cd client && npm run dev
   ```
   The client runs at `http://localhost:5173` and proxies WebSocket traffic to PartyKit.

3. **Play**:
   - Open http://localhost:5173
   - Create a lobby (choose languages) or join with a 4-letter code
   - Host starts the game when players are ready
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
