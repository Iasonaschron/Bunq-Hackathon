# Transaction Roulette

Transaction Roulette is a hackathon project built around a simple idea: make spending data social, funny, and slightly dangerous.

Players join a small game where AI-generated clues are created from transaction history. Each round shows a clue such as a suspicious late-night purchase or an expensive merchant visit, and players have to guess who made the transaction. The faster players guess correctly, the more points they earn. At the end, the leaderboard decides who wins the pot.

The project uses a FastAPI backend, a React + Vite frontend, Anthropic Claude for clue generation, and bunq sandbox APIs for payment/request flows.

## Features

- Multiplayer-style transaction guessing game
- AI-generated clues based on spending patterns
- Fake demo transaction data for hackathon testing
- Bot players with automatic guesses
- Speed-based scoring system
- Leaderboard with euro delta calculation
- bunq sandbox integration for balance checks, payments, and request inquiries
- Receipt splitting endpoint using image input + Claude vision
- Mobile-first React frontend design

## Project Structure

```txt
Bunq-Hackathon/
│
├── server.py              # FastAPI backend and game API routes
├── state.py               # Game state, player, clue, and round dataclasses
├── stats.py               # Transaction scoring and selection logic
├── clue_generator.py      # Claude-based clue and roast generation
├── bunq_client.py         # bunq sandbox setup/client logic
├── requirements.txt       # Python backend dependencies
├── FRONTEND_SPEC.md       # Frontend flow and design specification
│
├── frontend/              # React + Vite frontend
│   ├── package.json
│   └── ...
│
└── example/               # Example/demo files
