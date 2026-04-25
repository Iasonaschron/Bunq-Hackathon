from dataclasses import dataclass
import random


@dataclass
class ScoredTransaction:
    transaction: dict
    player_name: str
    score: int


def _amount(tx: dict) -> float:
    return abs(float(tx["amount"]["value"]))


def _hour(tx: dict) -> int:
    return int(tx["created"].split(" ")[1].split(":")[0])


def score_transaction(tx: dict, player_avg: float) -> int:
    amt = _amount(tx)
    hour = _hour(tx)
    score = 0
    if amt > player_avg * 2:
        score += 3
    if hour < 5:
        score += 3
    if amt > 200:
        score += 2
    if amt % 50 == 0:
        score += 1
    return score


def pick_interesting_transaction(players, used_clues: list, threshold: int = 3) -> ScoredTransaction | None:
    while threshold >= 0:
        candidates = []
        for player in players:
            txs = player.transactions
            if not txs:
                continue
            player_avg = sum(_amount(tx) for tx in txs) / len(txs)
            for tx in txs:
                key = (player.name, tx["description"], tx["amount"]["value"])
                if key in used_clues:
                    continue
                s = score_transaction(tx, player_avg)
                if s >= threshold:
                    candidates.append(ScoredTransaction(transaction=tx, player_name=player.name, score=s))

        if candidates:
            by_player: dict[str, list[ScoredTransaction]] = {}
            for c in candidates:
                by_player.setdefault(c.player_name, []).append(c)
            chosen_player = random.choice(list(by_player.keys()))
            return max(by_player[chosen_player], key=lambda x: x.score)

        threshold -= 1

    return None
