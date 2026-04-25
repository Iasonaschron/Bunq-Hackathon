import os
import re
from collections import defaultdict
import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _aggregate(transactions: list) -> dict:
    merchant_total: dict[str, float] = defaultdict(float)
    merchant_visits: dict[str, int] = defaultdict(int)
    late_night = []
    amounts = []

    for tx in transactions:
        amt = abs(float(tx["amount"]["value"]))
        merchant = tx["description"]
        hour = int(tx["created"].split(" ")[1].split(":")[0])
        merchant_total[merchant] += amt
        merchant_visits[merchant] += 1
        amounts.append(amt)
        if 0 <= hour < 5:
            late_night.append({"merchant": merchant, "amount": amt, "hour": hour})

    most_expensive = max(transactions, key=lambda t: abs(float(t["amount"]["value"])))
    me_amt = abs(float(most_expensive["amount"]["value"]))
    me_hour = int(most_expensive["created"].split(" ")[1].split(":")[0])

    return {
        "merchant_totals": dict(merchant_total),
        "merchant_visits": dict(merchant_visits),
        "late_night": late_night,
        "avg_amount": sum(amounts) / len(amounts) if amounts else 0,
        "most_expensive": {
            "merchant": most_expensive["description"],
            "amount": me_amt,
            "hour": me_hour,
        },
    }


def generate_clue(tx: dict, player_transactions: list) -> str:
    stats = _aggregate(player_transactions)
    amt = abs(float(tx["amount"]["value"]))
    hour = int(tx["created"].split(" ")[1].split(":")[0])
    merchant = tx["description"]
    visits = stats["merchant_visits"].get(merchant, 1)
    total_at_merchant = stats["merchant_totals"].get(merchant, amt)

    merchant_lines = "\n".join(
        f"  - {m}: {v} visit(s), €{stats['merchant_totals'][m]:.2f} total"
        for m, v in sorted(stats["merchant_visits"].items(), key=lambda x: -x[1])
    )
    late_night_lines = (
        "\n".join(f"  - {ln['merchant']} at {ln['hour']:02d}:00, €{ln['amount']:.2f}" for ln in stats["late_night"])
        if stats["late_night"] else "  none"
    )

    system = (
        "You write clues for a financial guessing game. "
        "Each clue is ONE short sentence — punchy, specific, a little savage. "
        "ALWAYS include the exact euro amount from the transaction data. "
        "Start with either 'Someone' or 'Who' — vary it. "
        "When starting with 'Who', end with a question mark. "
        "You may use '...' once for dramatic pause when it adds tension. "
        "No emojis. No bold. No asterisks. No quotes. Plain text only. "
        "Never be vague — use the real numbers. Never explain or add context."
    )

    user_msg = (
        f"Transaction: {merchant}, €{amt:.2f}, {hour:02d}:00\n"
        f"Total spent at {merchant} this month: €{total_at_merchant:.2f} across {visits} visit(s)\n"
        f"Their avg transaction: €{stats['avg_amount']:.2f}\n"
        f"Late-night purchases: {late_night_lines}\n"
        f"Full merchant breakdown: {merchant_lines}"
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=80,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
        stop_sequences=["\n"],
    )
    raw = response.content[0].text.strip()
    # strip non-latin characters / emojis
    raw = re.sub(r'[^\x00-\x7FÀ-ɏ€.\-?!,\' ]', '', raw).strip()
    return raw


def generate_roast(player_name: str, transactions: list) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"""Roast {player_name}'s spending habits based on these transactions:
{transactions}
Be funny, savage, and keep it under 3 sentences."""
        }]
    )
    return response.content[0].text
