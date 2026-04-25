from dataclasses import dataclass
import random


@dataclass
class ScoredTransaction:
    transaction: dict
    player_name: str
    score: int


def score_transaction(tx: dict, player_avg: float) -> int:
    score = 0
    if tx["amount"] > player_avg * 2:
        score += 3
    if tx["hour"] < 5:
        score += 3
    if tx["amount"] > 200:
        score += 2
    if tx["amount"] % 50 == 0:
        score += 1
    return score


def pick_interesting_transaction(players, used_clues: list, threshold: int = 3) -> ScoredTransaction | None:
    """
    Score all transactions relative to each player's own average.
    Pick one fairly across players (uniform distribution).
    Never repeats a used clue (matched by description+amount).
    Lowers threshold and retries if nothing passes.
    """
    while threshold >= 0:
        candidates = []
        for player in players:
            txs = player.transactions
            if not txs:
                continue
            player_avg = sum(tx["amount"] for tx in txs) / len(txs)
            for tx in txs:
                key = (player.name, tx["description"], tx["amount"])
                if key in used_clues:
                    continue
                s = score_transaction(tx, player_avg)
                if s >= threshold:
                    candidates.append(ScoredTransaction(transaction=tx, player_name=player.name, score=s))

        if candidates:
            # pick uniformly across players to avoid always hitting the same person
            by_player: dict[str, list[ScoredTransaction]] = {}
            for c in candidates:
                by_player.setdefault(c.player_name, []).append(c)
            chosen_player = random.choice(list(by_player.keys()))
            return max(by_player[chosen_player], key=lambda x: x.score)

        threshold -= 1

    return None
