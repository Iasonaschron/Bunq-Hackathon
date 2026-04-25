import asyncio
import random
import threading
from fastapi import FastAPI, HTTPException, Query
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

BOT_NAMES = {"Catrice", "Marco", "Sofia", "Jan"}


class JoinRequest(BaseModel):
    name: str

class GuessRequest(BaseModel):
    guesser_id: int
    guessed_player_id: int


def _speed_points(correct_count: int) -> int:
    """1st correct = 3pts, 2nd = 2pts, 3rd = 1pt, after that = 0."""
    return max(0, 3 - correct_count)


def _process_guess(guesser_id: int, guessed_id: int, round_idx: int):
    """Record a guess and award speed-based points. Returns { correct, points } or None if already guessed."""
    if round_idx >= len(game.rounds):
        return None
    rnd = game.rounds[round_idx]
    if guesser_id in rnd.guesses:
        return None  # already guessed this round
    rnd.guesses[guesser_id] = guessed_id
    correct = guessed_id == rnd.clue.correct_player_id
    pts = 0
    if correct:
        pts = _speed_points(rnd.correct_count)
        rnd.correct_count += 1
        guesser = next((p for p in game.players if p.user_id == guesser_id), None)
        if guesser:
            guesser.score += pts
    return {"correct": correct, "points": pts}


async def _fake_guess(round_idx: int, bot_id: int, delay: float, correct_player_id: int):
    await asyncio.sleep(delay)
    # 50% chance correct, 50% wrong (but never guess themselves)
    if random.random() < 0.5:
        guessed_id = correct_player_id
    else:
        others = [p.user_id for p in game.players if p.user_id != correct_player_id and p.user_id != bot_id]
        guessed_id = random.choice(others) if others else correct_player_id
    _process_guess(bot_id, guessed_id, round_idx)


def _generate_clues_background():
    used = []
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
    print(f"[prepare] done — {len(game.rounds)} clues ready")


@app.post("/prepare")
def prepare_game():
    if game.preparing:
        return {"status": "already preparing"}
    game.preparing = True
    # Ensure all 4 bot players exist before generating clues
    existing_names = {p.name for p in game.players}
    for pdef in PLAYER_DEFS:
        if pdef["name"] not in existing_names:
            game.players.append(Player(
                **pdef,
                balance=100.0,
                transactions=fake_transactions.get(pdef["name"], []),
            ))
    t = threading.Thread(target=_generate_clues_background, daemon=True)
    t.start()
    return {"status": "preparing"}


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
    print(f"[/start] called — {len(game.players)} player(s), {len(game.rounds)} clues ready")
    if game.started:
        raise HTTPException(status_code=400, detail="Game already started — call POST /reset first to start a new game")
    # If /prepare was never called, kick off generation now (fallback)
    if not game.preparing:
        existing_names = {p.name for p in game.players}
        for pdef in PLAYER_DEFS:
            if pdef["name"] not in existing_names:
                game.players.append(Player(
                    **pdef,
                    balance=100.0,
                    transactions=fake_transactions.get(pdef["name"], []),
                ))
        game.preparing = True
        t = threading.Thread(target=_generate_clues_background, daemon=True)
        t.start()
    game.pot = len(game.players) * 10.0
    game.started = True
    return {"status": "started", "pot": game.pot}


@app.get("/clue")
async def get_current_clue():
    if not game.started:
        raise HTTPException(status_code=404, detail="Game not started")
    # Wait up to 30s for the next clue to be generated (background thread may still be running)
    for _ in range(300):
        if game.current_round < len(game.rounds):
            break
        await asyncio.sleep(0.1)
    else:
        raise HTTPException(status_code=503, detail="Clue generation timed out")
    round_idx = game.current_round
    current = game.rounds[round_idx]

    # Schedule fake bot guesses the first time this round's clue is fetched
    if not current.fake_guesses_scheduled:
        current.fake_guesses_scheduled = True
        correct_id = current.clue.correct_player_id
        bots = [p for p in game.players if p.name in BOT_NAMES]
        for bot in bots:
            delay = random.uniform(2, 8)
            asyncio.create_task(_fake_guess(round_idx, bot.user_id, delay, correct_id))

    return {"round": round_idx, "clue": current.clue.text}


@app.post("/guess")
def submit_guess(req: GuessRequest):
    if not game.rounds or game.current_round >= len(game.rounds):
        raise HTTPException(status_code=400, detail="No active round")
    round_idx = game.current_round  # capture before advancing
    result = _process_guess(req.guesser_id, req.guessed_player_id, round_idx)
    if result is None:
        raise HTTPException(status_code=400, detail="Already guessed this round")
    game.rounds[round_idx].resolved = True
    game.current_round += 1
    return {
        "correct": result["correct"],
        "correct_player_id": game.rounds[round_idx].clue.correct_player_id,
        "points_earned": result["points"],
    }


@app.get("/round-status")
def round_status(round: int = Query(default=None)):
    idx = round if round is not None else game.current_round
    if idx >= len(game.rounds):
        raise HTTPException(status_code=404, detail="Round not found")
    rnd = game.rounds[idx]
    guesses = []
    for p in game.players:
        guessed_id = rnd.guesses.get(p.user_id)
        entry = {
            "player_name": p.name,
            "player_id": p.user_id,
            "has_guessed": guessed_id is not None,
        }
        if rnd.resolved:
            entry["correct"] = (guessed_id == rnd.clue.correct_player_id) if guessed_id is not None else False
        guesses.append(entry)
    return {
        "round": idx,
        "guesses": guesses,
        "resolved": rnd.resolved,
        "correct_player_id": rnd.clue.correct_player_id if rnd.resolved else None,
    }


@app.get("/scores")
def get_scores():
    return {
        "scores": sorted(
            [{"name": p.name, "score": p.score} for p in game.players],
            key=lambda x: x["score"], reverse=True,
        )
    }


@app.get("/leaderboard")
def get_leaderboard():
    roasts = {p.name: generate_roast(p.name, p.transactions) for p in game.players}
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
    game.preparing = False
    return {"status": "reset"}
