import asyncio
import json
import random
import threading
import uuid
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from state import game, Player, Clue, Round
from stats import pick_interesting_transaction
from clue_generator import generate_clue, generate_roast, client as claude_client
import urllib.request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

fake_transactions = {
    "Catrice": [
        {"id": "tx_c1", "created": "2026-04-24 02:18:00.000000", "amount": {"currency": "EUR", "value": "-34.80"}, "description": "Uber Eats", "counterparty_alias": {"display_name": "Uber Eats B.V."}},
        {"id": "tx_c2", "created": "2026-04-22 23:45:00.000000", "amount": {"currency": "EUR", "value": "-34.20"}, "description": "Uber Eats", "counterparty_alias": {"display_name": "Uber Eats B.V."}},
        {"id": "tx_c3", "created": "2026-04-18 01:30:00.000000", "amount": {"currency": "EUR", "value": "-27.50"}, "description": "Thuisbezorgd", "counterparty_alias": {"display_name": "Thuisbezorgd B.V."}},
        {"id": "tx_c4", "created": "2026-04-15 14:20:00.000000", "amount": {"currency": "EUR", "value": "-199.00"}, "description": "Zara", "counterparty_alias": {"display_name": "Zara Netherlands B.V."}},
        {"id": "tx_c5", "created": "2026-04-12 16:10:00.000000", "amount": {"currency": "EUR", "value": "-89.50"}, "description": "Nike", "counterparty_alias": {"display_name": "Nike Store Amsterdam"}},
        {"id": "tx_c6", "created": "2026-04-10 11:30:00.000000", "amount": {"currency": "EUR", "value": "-45.00"}, "description": "Rituals", "counterparty_alias": {"display_name": "Rituals Cosmetics"}},
        {"id": "tx_c7", "created": "2026-04-08 09:15:00.000000", "amount": {"currency": "EUR", "value": "-6.40"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
        {"id": "tx_c8", "created": "2026-04-05 21:55:00.000000", "amount": {"currency": "EUR", "value": "-29.90"}, "description": "H&M", "counterparty_alias": {"display_name": "H&M Netherlands"}},
        {"id": "tx_c9", "created": "2026-04-02 02:40:00.000000", "amount": {"currency": "EUR", "value": "-41.30"}, "description": "Uber Eats", "counterparty_alias": {"display_name": "Uber Eats B.V."}},
    ],
    "Marco": [
        {"id": "tx_m1", "created": "2026-04-23 03:12:00.000000", "amount": {"currency": "EUR", "value": "-500.00"}, "description": "Kraken", "counterparty_alias": {"display_name": "Kraken Europe B.V."}},
        {"id": "tx_m2", "created": "2026-04-20 23:50:00.000000", "amount": {"currency": "EUR", "value": "-1200.00"}, "description": "Booking.com", "counterparty_alias": {"display_name": "Booking.com B.V."}},
        {"id": "tx_m3", "created": "2026-04-17 04:05:00.000000", "amount": {"currency": "EUR", "value": "-200.00"}, "description": "Kraken", "counterparty_alias": {"display_name": "Kraken Europe B.V."}},
        {"id": "tx_m4", "created": "2026-04-15 03:58:00.000000", "amount": {"currency": "EUR", "value": "-8.50"}, "description": "McDonald's", "counterparty_alias": {"display_name": "McDonald's Amsterdam Centraal"}},
        {"id": "tx_m5", "created": "2026-04-11 23:20:00.000000", "amount": {"currency": "EUR", "value": "-32.00"}, "description": "Thuisbezorgd", "counterparty_alias": {"display_name": "Thuisbezorgd B.V."}},
        {"id": "tx_m6", "created": "2026-04-08 04:30:00.000000", "amount": {"currency": "EUR", "value": "-150.00"}, "description": "Kraken", "counterparty_alias": {"display_name": "Kraken Europe B.V."}},
        {"id": "tx_m7", "created": "2026-04-04 07:10:00.000000", "amount": {"currency": "EUR", "value": "-5.80"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
    ],
    "Sofia": [
        {"id": "tx_s1", "created": "2026-04-24 13:40:00.000000", "amount": {"currency": "EUR", "value": "-89.00"}, "description": "Sephora", "counterparty_alias": {"display_name": "Sephora Netherlands"}},
        {"id": "tx_s2", "created": "2026-04-21 15:20:00.000000", "amount": {"currency": "EUR", "value": "-600.00"}, "description": "Booking.com", "counterparty_alias": {"display_name": "Booking.com B.V."}},
        {"id": "tx_s3", "created": "2026-04-19 12:10:00.000000", "amount": {"currency": "EUR", "value": "-67.50"}, "description": "Sephora", "counterparty_alias": {"display_name": "Sephora Netherlands"}},
        {"id": "tx_s4", "created": "2026-04-16 14:55:00.000000", "amount": {"currency": "EUR", "value": "-45.00"}, "description": "Rituals", "counterparty_alias": {"display_name": "Rituals Cosmetics"}},
        {"id": "tx_s5", "created": "2026-04-13 21:30:00.000000", "amount": {"currency": "EUR", "value": "-28.40"}, "description": "Uber Eats", "counterparty_alias": {"display_name": "Uber Eats B.V."}},
        {"id": "tx_s6", "created": "2026-04-10 13:00:00.000000", "amount": {"currency": "EUR", "value": "-42.00"}, "description": "Sephora", "counterparty_alias": {"display_name": "Sephora Netherlands"}},
        {"id": "tx_s7", "created": "2026-04-07 10:30:00.000000", "amount": {"currency": "EUR", "value": "-9.20"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
        {"id": "tx_s8", "created": "2026-04-03 16:40:00.000000", "amount": {"currency": "EUR", "value": "-110.00"}, "description": "Sephora", "counterparty_alias": {"display_name": "Sephora Netherlands"}},
    ],
    "Jan": [
        {"id": "tx_j1", "created": "2026-04-23 01:20:00.000000", "amount": {"currency": "EUR", "value": "-59.99"}, "description": "Steam", "counterparty_alias": {"display_name": "Valve Corporation"}},
        {"id": "tx_j2", "created": "2026-04-21 07:05:00.000000", "amount": {"currency": "EUR", "value": "-4.50"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
        {"id": "tx_j3", "created": "2026-04-19 02:15:00.000000", "amount": {"currency": "EUR", "value": "-14.99"}, "description": "Steam", "counterparty_alias": {"display_name": "Valve Corporation"}},
        {"id": "tx_j4", "created": "2026-04-16 14:30:00.000000", "amount": {"currency": "EUR", "value": "-499.00"}, "description": "Coolblue", "counterparty_alias": {"display_name": "Coolblue B.V."}},
        {"id": "tx_j5", "created": "2026-04-13 03:45:00.000000", "amount": {"currency": "EUR", "value": "-7.99"}, "description": "Steam", "counterparty_alias": {"display_name": "Valve Corporation"}},
        {"id": "tx_j6", "created": "2026-04-10 08:00:00.000000", "amount": {"currency": "EUR", "value": "-3.80"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
        {"id": "tx_j7", "created": "2026-04-07 04:10:00.000000", "amount": {"currency": "EUR", "value": "-12.50"}, "description": "McDonald's", "counterparty_alias": {"display_name": "McDonald's Amsterdam Centraal"}},
        {"id": "tx_j8", "created": "2026-04-04 01:55:00.000000", "amount": {"currency": "EUR", "value": "-19.99"}, "description": "Steam", "counterparty_alias": {"display_name": "Valve Corporation"}},
        {"id": "tx_j9", "created": "2026-04-01 07:20:00.000000", "amount": {"currency": "EUR", "value": "-5.10"}, "description": "Albert Heijn", "counterparty_alias": {"display_name": "Albert Heijn B.V."}},
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


FALLBACK_CLUES = [
    "Someone spent €89.50 on Uber Eats... at 2am.",
    "Who dropped €1200 on Booking.com at midnight?",
    "Someone spent €600 on Sephora in a single visit.",
    "Who bought €499 worth of tech from Coolblue at 2am?",
    "Someone has sent €850 to Kraken this month alone.",
]

def _generate_clues_background():
    import traceback
    print(f"[prepare] background thread started — {len(game.players)} players")
    used = []
    fallback_idx = 0
    for i in range(6):
        scored = pick_interesting_transaction(game.players, used)
        if scored is None:
            print(f"[prepare] no more interesting transactions at round {i}")
            break
        correct_player = next(p for p in game.players if p.name == scored.player_name)
        print(f"[prepare] generating clue {i+1} for {scored.player_name}…")
        try:
            clue_text = generate_clue(scored.transaction, correct_player.transactions)
        except Exception as e:
            print(f"[prepare] Claude API error on clue {i+1}: {e}")
            traceback.print_exc()
            clue_text = FALLBACK_CLUES[fallback_idx % len(FALLBACK_CLUES)]
            fallback_idx += 1
        clue = Clue(text=clue_text, correct_player_id=correct_player.user_id)
        game.clues.append(clue)
        game.rounds.append(Round(clue=clue))
        used.append((scored.player_name, scored.transaction["description"], scored.transaction["amount"]["value"]))
        print(f"[prepare] clue {i+1} ready")
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
    existing = next((p for p in game.players if p.name.lower() == req.name.lower()), None)
    if existing:
        return {"player_id": existing.user_id, "name": existing.name, "balance": existing.balance}
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
    # Wait up to 60s for the next clue to be generated
    for _ in range(600):
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
    if not game.players:
        return {"scores": []}
    sorted_players = sorted(game.players, key=lambda p: p.score, reverse=True)
    bet = game.pot / len(game.players) if game.players else 10.0
    top_score = sorted_players[0].score
    winners = [p for p in sorted_players if p.score == top_score]
    winner_share = game.pot / len(winners)
    scores = []
    for p in sorted_players:
        if p.score == top_score:
            euro_delta = winner_share - bet
        else:
            euro_delta = -bet
        scores.append({"name": p.name, "score": p.score, "euro_delta": round(euro_delta, 2)})
    return {"scores": scores}


@app.get("/transactions")
def get_transactions():
    return {p.name: p.transactions for p in game.players}


BUNQ_BASE = "https://public-api.sandbox.bunq.com/v1"

PLAYER_EMAILS = {
    "Marco": "test+marco@bunq.com",
    "Sofia": "test+sofia@bunq.com",
    "Jan": "test+jan@bunq.com",
}


class SplitBillRequest(BaseModel):
    image_base64: str
    instruction: str
    media_type: str = "image/jpeg"


@app.post("/split-bill")
def split_bill(req: SplitBillRequest):
    response = claude_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": req.media_type,
                        "data": req.image_base64,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        f"Here is a receipt image and a splitting instruction from the user.\n"
                        f"Instruction: {req.instruction}\n\n"
                        "Extract all items and prices from the receipt.\n"
                        "Then apply the splitting instruction to calculate exactly how much each person owes.\n"
                        "The people available are: Marco, Sofia, Jan, Catrice (that's me, exclude me from requests).\n"
                        'Reply ONLY in JSON format:\n'
                        '{ "items": [{ "name": "str", "price": 0.0 }], '
                        '"splits": [{ "person": "str", "amount": 0.0, "reason": "str" }] }'
                    ),
                },
            ],
        }]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else parts[0]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Claude returned invalid JSON: {raw[:300]}")

    from bunq_client import headers as bunq_headers, user_id as bunq_user_id, account_id as bunq_account_id

    for split in data.get("splits", []):
        email = PLAYER_EMAILS.get(split["person"])
        if not email:
            continue
        req_headers = {**bunq_headers, "X-Bunq-Client-Request-Id": str(uuid.uuid4())}
        body = json.dumps({
            "amount": {"value": f"{split['amount']:.2f}", "currency": "EUR"},
            "counterparty_alias": {"type": "EMAIL", "value": email},
            "description": split.get("reason", "Bill split"),
        }).encode()
        bunq_req = urllib.request.Request(
            f"{BUNQ_BASE}/user/{bunq_user_id}/monetary-account/{bunq_account_id}/request-inquiry",
            data=body,
            headers=req_headers,
            method="POST",
        )
        try:
            urllib.request.urlopen(bunq_req)
        except Exception:
            pass

    return {"items": data.get("items", []), "splits": data.get("splits", []), "requests_sent": True}


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
