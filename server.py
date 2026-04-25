from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from state import game, Player, Clue, Round
from stats import pick_interesting_transaction
from clue_generator import generate_clue, generate_roast

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

fake_transactions = {
    "Catrice": [
        {"amount": 89.50, "description": "Uber Eats", "hour": 2, "category": "food"},
        {"amount": 340.00, "description": "Nike Store", "hour": 14, "category": "shopping"},
        {"amount": 4.50, "description": "Albert Heijn", "hour": 8, "category": "groceries"},
        {"amount": 199.00, "description": "Zara", "hour": 22, "category": "shopping"},
    ],
    "Marco": [
        {"amount": 1200.00, "description": "Airbnb Ibiza", "hour": 23, "category": "travel"},
        {"amount": 50.00, "description": "Crypto.com", "hour": 3, "category": "investment"},
        {"amount": 8.50, "description": "McDonald's", "hour": 4, "category": "food"},
    ],
    "Sofia": [
        {"amount": 250.00, "description": "Sephora", "hour": 13, "category": "beauty"},
        {"amount": 45.00, "description": "Astrology reading", "hour": 21, "category": "misc"},
        {"amount": 600.00, "description": "Louis Vuitton", "hour": 15, "category": "shopping"},
    ],
    "Jan": [
        {"amount": 12.00, "description": "Steam games", "hour": 1, "category": "gaming"},
        {"amount": 3.50, "description": "Albert Heijn", "hour": 7, "category": "groceries"},
        {"amount": 500.00, "description": "GPU purchase", "hour": 2, "category": "tech"},
    ],
}

PLAYER_DEFS = [
    {"user_id": 3628850, "account_id": 3620674, "name": "Catrice", "email": "test+catrice@bunq.com"},
    {"user_id": 1002, "account_id": 2002, "name": "Marco", "email": "test+marco@bunq.com"},
    {"user_id": 1003, "account_id": 2003, "name": "Sofia", "email": "test+sofia@bunq.com"},
    {"user_id": 1004, "account_id": 2004, "name": "Jan", "email": "test+jan@bunq.com"},
]


class JoinRequest(BaseModel):
    name: str

class GuessRequest(BaseModel):
    guesser_id: int
    guessed_player_id: int


@app.post("/join")
def join_game(req: JoinRequest):
    match = next((p for p in PLAYER_DEFS if p["name"].lower() == req.name.lower()), None)
    if match:
        player = Player(**match, balance=100.0, transactions=fake_transactions.get(match["name"], []))
    else:
        player = Player(
            user_id=len(game.players) + 9000,
            account_id=len(game.players) + 8000,
            name=req.name,
            email=f"{req.name.lower()}@sandbox.bunq.com",
            balance=100.0,
            transactions=[],
        )
    game.players.append(player)
    return {"player_id": player.user_id, "name": player.name, "balance": player.balance}


@app.post("/start")
def start_game():
    if game.started:
        raise HTTPException(status_code=400, detail="Game already started")

    # Ensure all 4 players exist (fill in any not manually joined)
    existing_names = {p.name for p in game.players}
    for pdef in PLAYER_DEFS:
        if pdef["name"] not in existing_names:
            game.players.append(Player(
                **pdef,
                balance=100.0,
                transactions=fake_transactions.get(pdef["name"], []),
            ))

    game.pot = len(game.players) * 10.0

    # Generate clues for all rounds upfront (do this before marking started)
    used: list = []
    for _ in range(5):
        scored = pick_interesting_transaction(game.players, used)
        if scored is None:
            break
        clue_text = generate_clue(scored.transaction)
        correct_player = next(p for p in game.players if p.name == scored.player_name)
        clue = Clue(text=clue_text, correct_player_id=correct_player.user_id)
        game.clues.append(clue)
        game.rounds.append(Round(clue=clue))
        used.append((scored.player_name, scored.transaction["description"], scored.transaction["amount"]))

    game.started = True
    return {"status": "started", "pot": game.pot, "num_clues": len(game.clues)}


@app.get("/clue")
def get_current_clue():
    if not game.rounds:
        raise HTTPException(status_code=404, detail="No rounds started")
    if game.current_round >= len(game.rounds):
        raise HTTPException(status_code=404, detail="No more clues")
    current = game.rounds[game.current_round]
    return {"round": game.current_round, "clue": current.clue.text}


@app.post("/guess")
def submit_guess(req: GuessRequest):
    if not game.rounds or game.current_round >= len(game.rounds):
        raise HTTPException(status_code=400, detail="No active round")
    current = game.rounds[game.current_round]
    current.guesses[req.guesser_id] = req.guessed_player_id
    correct = req.guessed_player_id == current.clue.correct_player_id

    guesser = next((p for p in game.players if p.user_id == req.guesser_id), None)
    if not correct and guesser:
        guesser.balance -= 5.0
        game.pot += 5.0
    elif correct and guesser:
        guesser.score += 1

    current.resolved = True
    game.current_round += 1

    return {"correct": correct, "correct_player_id": current.clue.correct_player_id}


@app.get("/leaderboard")
def get_leaderboard():
    roasts = {
        p.name: generate_roast(p.name, p.transactions)
        for p in game.players
    }
    scores = [{"name": p.name, "score": p.score, "balance": p.balance} for p in game.players]
    return {
        "scores": sorted(scores, key=lambda x: x["score"], reverse=True),
        "roasts": roasts,
    }


@app.get("/transactions")
def get_transactions():
    return {p.name: p.transactions for p in game.players}


@app.post("/reset")
def reset_game():
    game.players.clear()
    game.clues.clear()
    game.rounds.clear()
    game.current_round = 0
    game.pot = 0.0
    game.started = False
    game.finished = False
    return {"status": "reset"}
