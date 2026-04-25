from bunq.sdk.context.api_context import ApiContext
from bunq.sdk.context.bunq_context import BunqContext
import requests

# Your 3 boilerplate lines
api_context = ApiContext.restore("bunq.conf")
BunqContext.load_api_context(api_context)
session_token = api_context.session_context.token

# Your known IDs
user_id = 3628850
account_id = 3620674

# Always the same headers
headers = {
    "X-Bunq-Client-Authentication": session_token,
    "Content-Type": "application/json",
    "User-Agent": "HackathonApp",
    "X-Bunq-Language": "en_US",
    "X-Bunq-Region": "nl_NL",
    "X-Bunq-Geolocation": "0 0 0 0 000",
    "X-Bunq-Client-Request-Id": "hackathon123",
    "Cache-Control": "no-cache"
}

# Ask Sugar Daddy for €10
response = requests.post(
    f"https://public-api.sandbox.bunq.com/v1/user/{user_id}/monetary-account/{account_id}/request-inquiry",
    headers=headers,
    json={
        "amount_inquired": { "value": "10.00", "currency": "EUR" },
        "counterparty_alias": {
            "type": "EMAIL",
            "value": "sugardaddy@bunq.com",
            "name": "Sugar Daddy"
        },
        "description": "gimme money",
        "allow_bunqme": False
    }
)

print(response.json())

response = requests.get(
    f"https://public-api.sandbox.bunq.com/v1/user/{user_id}/monetary-account/{account_id}",
    headers=headers
)

data = response.json()
account = data["Response"][0]["MonetaryAccountBank"]
print(f"Balance: €{account['balance']['value']}")

