# TriviaBlast — Implementation Plan

## App Description
A real-time multiplayer trivia game where players join game rooms, answer timed questions across categories, and compete on a live leaderboard — all powered by Electric SQL sync.

## Data Model

### categories
- id: UUID, primary key, defaultRandom()
- name: text, notNull
- emoji: text, notNull
- created_at: timestamptz, notNull, defaultNow()

### questions
- id: UUID, primary key, defaultRandom()
- category_id: UUID, notNull, FK → categories.id, onDelete cascade
- question_text: text, notNull
- correct_answer: text, notNull
- wrong_answer_1: text, notNull
- wrong_answer_2: text, notNull
- wrong_answer_3: text, notNull
- difficulty: text, notNull (easy | medium | hard)
- created_at: timestamptz, notNull, defaultNow()

### game_rooms
- id: UUID, primary key, defaultRandom()
- code: text, notNull, unique (short join code e.g. "XK92")
- host_name: text, notNull
- status: text, notNull (waiting | playing | finished)
- current_question_id: UUID, nullable, FK → questions.id
- question_started_at: timestamptz, nullable
- created_at: timestamptz, notNull, defaultNow()
- updated_at: timestamptz, notNull, defaultNow()

### players
- id: UUID, primary key, defaultRandom()
- room_id: UUID, notNull, FK → game_rooms.id, onDelete cascade
- name: text, notNull
- score: integer, notNull, default 0
- is_ready: boolean, notNull, default false
- created_at: timestamptz, notNull, defaultNow()
- updated_at: timestamptz, notNull, defaultNow()

### answers
- id: UUID, primary key, defaultRandom()
- room_id: UUID, notNull, FK → game_rooms.id, onDelete cascade
- question_id: UUID, notNull, FK → questions.id, onDelete cascade
- player_id: UUID, notNull, FK → players.id, onDelete cascade
- selected_answer: text, notNull
- is_correct: boolean, notNull
- answered_at: timestamptz, notNull, defaultNow()

## Implementation Tasks
- [ ] Phase 2: Discover playbook skills and read relevant ones
- [ ] Phase 3: Data model — schema, zod-schemas, migrations, tests
- [ ] Phase 4: Collections & API routes
- [ ] Phase 5: UI components
- [ ] Phase 6: Build, lint & test
- [ ] Phase 7: README.md
- [ ] Phase 8: Deploy & send `@room REVIEW_REQUEST:` (MANDATORY — pipeline stalls without it)

## Features
- **Lobby system**: Create a room with a short join code; friends join by entering the code
- **Categories**: Science, History, Geography, Pop Culture, Sports (5 pre-seeded categories)
- **Pre-seeded questions**: 25 questions (5 per category) ready to play at startup
- **Timed questions**: 20 seconds per question; faster answers = more points (max 1000)
- **Live leaderboard**: Real-time score updates via Electric SQL sync
- **Ready system**: Host starts the game when all players mark ready

## Design Conventions
- UUID primary keys with defaultRandom()
- timestamp({ withTimezone: true }) for all dates
- snake_case for SQL table/column names
- Foreign keys with onDelete: "cascade" where appropriate
