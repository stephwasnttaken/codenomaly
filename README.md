# Codenomaly

A real-time browser multiplayer game inspired by "I'm On Observation Duty." Players find anomalies (errors) in code and guess their types before the bugs overwhelm the codebase. Work together, manage your stability, and survive 5 minutes to win.

**Built by Stephen Mertyl, Naima Sana, Kira Archer, Marilyn Anderson**
**Official Website: https://codenomaly.vercel.app/**

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor, Zustand
- **Backend**: PartyKit (WebSocket-based real-time server)
- **State**: Zustand (client), PartyKit broadcasts (server state)

## Getting Started

### Prerequisites

- Node.js 18+

### Development

**You must run both the PartyKit server and the Vite client.** The client proxies WebSocket traffic to PartyKit; if PartyKit isn't running, you'll see `ECONNREFUSED` and the lobby will stay on "Connecting…" with no players.

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
   - Find errors in the code, select a line, and guess the error type from the dropdown
   - Keep your stability up and avoid letting errors reach the limit (game over)
   - Survive 5 minutes to win

### Build

```bash
cd client && npm run build
```

### Deploy

- **Frontend**: Deploy `client/dist` to Vercel, Netlify, or Cloudflare Pages
- **Backend**: `cd party && npm run deploy`
- Set `VITE_PARTY_HOST` to your PartyKit deployment URL (e.g. `codenomaly.yourname.partykit.dev`)

## How to Play

### Lobby

- **Create**: Choose a programming language (C#, C, or Python), pick a map (each has a short description), and create a lobby. Share the 4-letter code with friends.
- **Join**: Enter the 4-letter code and your name to join an existing lobby.
- The host can start the game when at least one other player has joined.

### Selecting and fixing errors

- **Click a line** in the code editor to select it. A dropdown appears above the editor.
- Choose the **error type** (e.g. "Syntax (structure / delimiters)", "Name / reference (wrong word)").
- Choose the **specific cause** (e.g. "Missing semicolon", "Misspelled keyword or identifier").
- A **correct guess** removes the error and increases your stability. A **wrong guess** reduces it.
- The maximum number of errors allowed increases with the number of players; if the total errors in the codebase reach that limit, the game ends in a loss.

### Stability

- Your **stability meter** (0–100%) is shown on the left. It goes **down** over time when you view files that contain errors, and **up** when you view files with no errors or when you fix an error correctly.
- If stability reaches **0%**, your screen glitches for several seconds and you recover to 50%. You can't interact during the glitch.
- **Survive 5 minutes** (or until the timer runs out) to win.

### Popups

- During the game, **random popup windows** may appear (e.g. messages, warnings). Close them by clicking the **X** in the top-right corner so you can keep playing.

### Winning and losing

- **Win**: Survive until the 5-minute timer ends.
- **Lose**: The total number of errors in the codebase reaches the limit (based on player count).
- After the game, use **Return to Lobby** to go back; once everyone has returned, the host can start another round.

## Project Structure

```
codenomaly/
├── client/          # Vite + React frontend
├── party/           # PartyKit server
├── shared/          # Shared types (reference)
└── README.md
```
