from bunq.sdk.context.api_context import ApiContext
from bunq.sdk.context.bunq_context import BunqContext
import requests

api_context = ApiContext.restore("bunq.conf")
BunqContext.load_api_context(api_context)
session_token = api_context.session_context.token

user_id = 3628850
account_id = 3620674

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