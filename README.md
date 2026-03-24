# TriviaBlast ⚡

Real-time multiplayer trivia game — battle your friends with live-synced questions, a ticking timer, and a live leaderboard.

## Features

- **Multiplayer rooms** — share a 4-character code with friends to join
- **Live sync** — all players see the same question state instantly via Electric SQL
- **Timed questions** — 20 seconds per question; faster answers earn more points (up to 1000)
- **Live leaderboard** — scores update in real-time as players answer
- **Pre-seeded content** — 5 categories with 25 questions ready to play immediately
- **Optimistic updates** — UI responds instantly before server confirmation
- **Host controls** — host advances questions and ends the game

## Tech Stack

- **[Electric SQL](https://electric-sql.com)** — Postgres-to-client real-time sync via shapes
- **[TanStack DB](https://tanstack.com/db)** — reactive collections and optimistic mutations
- **[Drizzle ORM](https://orm.drizzle.team)** — schema definitions and migrations
- **[TanStack Start](https://tanstack.com/start)** — React SSR meta-framework
- **[Radix UI Themes](https://www.radix-ui.com/themes)** — component library

## Getting Started

```bash
pnpm install
pnpm drizzle-kit migrate
pnpm dev:start
```

Then open `http://localhost:5173` in your browser.

## How to Play

1. **Host**: Click "Host a Game", enter your name → get a 4-character room code
2. **Players**: Click "Join a Game", enter the code and your name
3. **Lobby**: Players mark themselves as ready; host clicks "Start Game"
4. **Game**: Answer questions before the 20s timer runs out — faster = more points
5. **Results**: See the final leaderboard and champion!

## Data Model

| Table | Purpose |
|-------|---------|
| `categories` | Trivia categories (Science, History, Geography, Pop Culture, Sports) |
| `questions` | Questions with correct + 3 wrong answers per category |
| `game_rooms` | Game room state (status, current question, round info) |
| `players` | Players in a room with live scores |
| `answers` | Player answers with correctness and points earned |
