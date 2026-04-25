Transaction Roulette — Hackathon Project Context
What we are building
A social guessing game called Transaction Roulette built on top of the bunq banking API.
Friends join a game room. Everyone puts money in a pot upfront. The AI analyzes synthetic transaction data from all players, generates funny/interesting clues ("who spent €340 on Uber Eats at 2am?"), and players guess who the clue belongs to. The winner takes the pot via a real bunq sandbox payment.

Tech Stack

Backend: Python + FastAPI
Banking API: bunq Sandbox API
AI: Anthropic Claude API (claude-sonnet-4-20250514)
Frontend: React with Vite


How frontend and backend communicate
React and Python are separate processes. They never see each other's code. They talk via HTTP — React calls endpoints, Python returns JSON. React never touches bunq or Claude directly.
React (localhost:5173)  →  HTTP request  →  Python (localhost:8000)
                                                    ↓
                                             bunq API / Claude API
                        ←  JSON response  ←
CORS must be enabled on FastAPI so React can talk to it across ports.

File Structure
bunq-hackathon/
  CLAUDE.md              ← context file, you are here
  bunq.conf              ← DO NOT DELETE, DO NOT COMMIT
  .env                   ← API keys, DO NOT COMMIT
  .gitignore             ← must include bunq.conf and .env

  bunq_client.py         ← bunq auth boilerplate, ALREADY DONE
  state.py               ← owns game_state dict, imported everywhere
  server.py              ← FastAPI app, all endpoints
  stats.py               ← interestingness scoring pipeline
  clue_generator.py      ← Claude API integration

  frontend/              ← React app via Vite
    src/
      App.jsx
      components/
        BottomNav.jsx    ← fixed bottom nav (Home / Messages / Profile)
        BottomNav.css
      screens/
        Home.jsx         ← dashboard: balance card + Catrice's transactions
        Home.css
        ChatList.jsx     ← bunq-style chat inbox (messages screen)
        ChatList.css
        GroupChat.jsx    ← "🏔️ Sky Trip" fake group chat → launches game
        GroupChat.css
        Chat.jsx         ← THE GAME (do not touch)
        Lobby.jsx        ← players join, bets placed
        Game.jsx         ← clues shown, guesses made
        Results.jsx      ← final scores + AI roast

bunq API
Base URL
https://public-api.sandbox.bunq.com/v1
Authentication
Every request needs these headers. Already set up in bunq_client.py:
pythonheaders = {
    "X-Bunq-Client-Authentication": session_token,
    "Content-Type": "application/json",
    "User-Agent": "HackathonApp",
    "X-Bunq-Language": "en_US",
    "X-Bunq-Region": "nl_NL",
    "X-Bunq-Geolocation": "0 0 0 0 000",
    "X-Bunq-Client-Request-Id": "hackathon123",
    "Cache-Control": "no-cache"
}
Our sandbox user (Player 1)
user_id    = 3628850
account_id = 3620674
name       = Catrice Elizabeth
api_key    = sandbox_5a56d3425766de239e6522273bb7590c315e4d9b40d428ab4db5aa59
Key endpoints
GET  /v1/user/{user_id}/monetary-account/{account_id}
     → get balance

GET  /v1/user/{user_id}/monetary-account/{account_id}/payment
     → get transactions

POST /v1/user/{user_id}/monetary-account/{account_id}/request-inquiry
     → request money (use sugardaddy@bunq.com for free sandbox money, max €500)

POST /v1/user/{user_id}/monetary-account/{account_id}/payment
     → send money to someone

POST /v1/sandbox-user-person
     → create a new sandbox user (no auth needed)
Response format
json{ "Response": [ { "SomeObject": { ... } } ] }
Access like: data["Response"][0]["MonetaryAccountBank"]
Sugar Daddy
Special sandbox user at sugardaddy@bunq.com who auto-approves any money request up to €500.

How bunq_client.py works (ALREADY DONE)
Every file imports from this. It loads bunq.conf and exposes everything needed:
pythonfrom bunq_client import user_id, account_id, headers, session_token

state.py — single source of truth
One file owns game_state. All other files import it. Editing it in one file updates it everywhere (same as passing an object by reference in Java).
python# state.py
game_state = {
    "players": [],
    "transactions": {},    # { "player_name": [ ...transactions ] }
    "scores": {},          # { "player_name": 0 }
    "used_clues": [],
    "pot": 0.00,
    "current_clue": None,
    "current_answer": None  # NEVER send this to frontend
}
Import anywhere:
pythonfrom state import game_state
game_state["pot"] = 5.00  # updates the same object everywhere

The 5 endpoints (server.py)
POST /api/start-game
     → load synthetic transactions into game_state
     → register players and their bunq account details
     → record entry bet, add to pot

GET  /api/clue
     → run stats pipeline to pick interesting transaction
     → send to Claude, get funny clue back
     → store correct answer in game_state["current_answer"]
     → return clue to frontend (NO answer included)

POST /api/guess
     body: { "player": "name", "guess": "other_player_name" }
     → check against game_state["current_answer"]
     → if wrong: trigger bunq payment from guesser to pot
     → update scores
     → return result

GET  /api/leaderboard
     → return scores + generate AI roast for each player

GET  /api/transactions
     → return all transactions from game_state (for debugging)

Transaction data is synthetic
Sandbox accounts start empty. Generate fake but realistic and funny transactions in Python. Load them into game_state at start-game. Make them juicy.
pythonfake_transactions = {
    "Catrice": [
        { "amount": 89.50, "description": "Uber Eats", "hour": 2, "category": "food" },
        { "amount": 340.00, "description": "Nike Store", "hour": 14, "category": "shopping" },
        { "amount": 4.50, "description": "Albert Heijn", "hour": 8, "category": "groceries" },
        { "amount": 199.00, "description": "Zara", "hour": 22, "category": "shopping" },
    ],
    "Marco": [
        { "amount": 1200.00, "description": "Airbnb Ibiza", "hour": 23, "category": "travel" },
        { "amount": 50.00, "description": "Crypto.com", "hour": 3, "category": "investment" },
        { "amount": 8.50, "description": "McDonald's", "hour": 4, "category": "food" },
    ],
    "Sofia": [
        { "amount": 250.00, "description": "Sephora", "hour": 13, "category": "beauty" },
        { "amount": 45.00, "description": "Astrology reading", "hour": 21, "category": "misc" },
        { "amount": 600.00, "description": "Louis Vuitton", "hour": 15, "category": "shopping" },
    ],
    "Jan": [
        { "amount": 12.00, "description": "Steam games", "hour": 1, "category": "gaming" },
        { "amount": 3.50, "description": "Albert Heijn", "hour": 7, "category": "groceries" },
        { "amount": 500.00, "description": "GPU purchase", "hour": 2, "category": "tech" },
    ]
}

stats.py — interestingness scoring pipeline
1. Take all transactions from game_state
2. Score each by interestingness
3. If nothing passes threshold → lower threshold and retry
4. Pick one transaction fairly across players (uniform distribution)
5. Mark as used so it never repeats
6. Return the transaction + which player it belongs to
Score by deviation from the player's own average — not absolute value:
pythondef score_transaction(tx, player_avg):
    score = 0
    if tx["amount"] > player_avg * 2:   score += 3  # unusually large for this person
    if tx["hour"] < 5:                  score += 3  # late night
    if tx["amount"] > 200:              score += 2  # big spend
    if tx["amount"] % 50 == 0:          score += 1  # suspiciously round
    return score

clue_generator.py — Claude API integration
pythonimport anthropic
import os
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_clue(tx):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""
You are the host of a funny financial guessing game with 4 players.
Here is a real bank transaction from one of them:
Amount: €{tx["amount"]}
Description: {tx["description"]}
Time: {tx["hour"]}:00
Category: {tx["category"]}

Write one short funny clue about this transaction without revealing the player's name.
Max 2 sentences. Be witty and a little savage.
"""
        }]
    )
    return response.content[0].text

def generate_roast(player_name, transactions):
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"""
Roast {player_name}'s spending habits based on these transactions:
{transactions}
Be funny, savage, and keep it under 3 sentences.
"""
        }]
    )
    return response.content[0].text

API Keys — .env file
ANTHROPIC_API_KEY=your_key_here
BUNQ_API_KEY=sandbox_5a56d3425766de239e6522273bb7590c315e4d9b40d428ab4db5aa59
Install: pip install python-dotenv anthropic fastapi uvicorn
Add to .gitignore: .env and bunq.conf

Game Flow
1. POST /api/start-game → loads fake transactions, registers 4 players, takes bets
2. GET  /api/clue       → picks interesting tx, Claude makes it funny, returns clue
3. Players guess on frontend
4. POST /api/guess      → checks answer, moves money if wrong, updates scores
5. Repeat steps 2-4 for N rounds
6. GET  /api/leaderboard → shows final scores + Claude roasts each player

Important Rules

NEVER commit bunq.conf or .env to git
Always use sandbox endpoints
Sugar Daddy max €500 per request
Transaction data is synthetic — make it funny
game_state lives in state.py — never recreate it elsewhere
Keep it simple — 24 hour hackathon

## Frontend — Navigation & Screen Flow (ALREADY DONE)

App.jsx routes:
  /           → Home.jsx       (dashboard)
  /messages   → ChatList.jsx   (chat inbox)
  /group      → GroupChat.jsx  (group chat → launches game)
  /chat       → Chat.jsx       (THE GAME — do not touch)
  /lobby      → Lobby.jsx
  /game       → Game.jsx
  /results    → Results.jsx

BottomNav.jsx (fixed bottom bar on Home, ChatList, GroupChat):
- "🏠 Home" → /
- "💬 Messages" → /messages   (also highlighted when on /group)
- "👤 Profile" → not clickable, grayed out
- Active tab shown in bunq green (#00D166)
- Height: 64px, position: fixed bottom 0
- All screens that include BottomNav must have padding-bottom: 72px

Home.jsx — dashboard screen:
- Header: "Hey, Catrice 👋" + green avatar
- Balance card: fetches GET /transactions on mount
  - Shows spinner while loading
  - On success: displays "€ 100.00" (player starting balance)
  - On failure: displays "—"
- Quick action pills: "💸 Send" and "📥 Request" (visual only, not functional)
- Recent Transactions: Catrice's transactions from GET /transactions
  - Falls back to hardcoded FALLBACK_TXS if server is down or game not started
  - Shows emoji icon per category, merchant name, time (HH:00), amount in red
- Category icons: food=🍔 shopping=🛍️ groceries=🛒 travel=✈️ investment=📈
                  beauty=💄 misc=✨ gaming=🎮 tech=💻

ChatList.jsx — messages inbox:
- Pinned group chat: "🏔️ Sky Trip" with members Marco, Sofia, Jan, Catrice
  - Last message: "omg who did that 😭", time: "now"
  - Clicking navigates to /group
- DM chats (Marco, Sofia, Jan): non-clickable, grayed out, for visual flavor only
- Includes BottomNav at the bottom

GroupChat.jsx — fake group chat:
- Header: "🏔️ Sky Trip" + member list, back arrow → /messages
- 8 hardcoded messages between Marco, Sofia, Jan, Catrice (funny banter about spending)
- Footer: prominent bunq-green "💸 Play Transaction Roulette" button → navigates to /chat
- Fake read-only message input below the button
- Includes BottomNav at the bottom

Design system (bunq style):
- Background: #F2F2F7
- Cards/surfaces: #FFFFFF with border-radius 16-22px
- Primary green: #00D166
- Text primary: #1C1C1E
- Text secondary: #8E8E93
- Separator: #E5E5EA (0.5px)
- Font: system-ui / Segoe UI / Roboto
- Active press: scale(0.975) transform

## Important fix needed — Player transactions

The Player dataclass in state.py is missing a transactions field.
Add it:

```python
@dataclass
class Player:
    user_id: int
    account_id: int
    name: str
    email: str
    balance: float = 0.0
    score: int = 0
    transactions: list = field(default_factory=list)
```

The /start endpoint in server.py should load fake transactions
into each player object when the game starts. Use the fake_transactions
dict from CLAUDE.md as the data source. Match players by name.

Player average is calculated as:
player_avg = sum(tx["amount"] for tx in player.transactions) / len(player.transactions)

stats.py must receive a player's transactions AND their average
to score correctly.