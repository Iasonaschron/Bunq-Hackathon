import os
import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def generate_clue(tx: dict) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""You are the host of a funny financial guessing game with 4 players.
Here is a real bank transaction from one of them:
Amount: €{tx["amount"]}
Description: {tx["description"]}
Time: {tx["hour"]}:00
Category: {tx["category"]}

Write one short funny clue about this transaction without revealing the player's name.
Max 2 sentences. Be witty and a little savage."""
        }]
    )
    return response.content[0].text


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
