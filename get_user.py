from bunq.sdk.context.api_context import ApiContext
from bunq.sdk.context.bunq_context import BunqContext
from bunq.sdk.model.generated.endpoint import UserPersonApiObject
import requests
import json

api_context = ApiContext.restore("bunq.conf")
BunqContext.load_api_context(api_context)

user = UserPersonApiObject.get().value
user_id = user.id_
print(f"User ID: {user_id}")
print(f"Name: {user.display_name}")

# Get session token directly from context
session_token = api_context.session_context.token

# Direct HTTP call
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

response = requests.get(
    f"https://public-api.sandbox.bunq.com/v1/user/{user_id}/monetary-account",
    headers=headers
)

data = response.json()
account = data["Response"][0]["MonetaryAccountBank"]
account_id = account["id"]
balance = account["balance"]["value"]
print(f"Account ID: {account_id}")
print(f"Balance: €{balance}")