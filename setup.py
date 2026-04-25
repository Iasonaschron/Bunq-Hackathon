from bunq.sdk.context.api_context import ApiContext
from bunq.sdk.context.api_environment_type import ApiEnvironmentType

API_KEY = "sandbox_5a56d3425766de239e6522273bb7590c315e4d9b40d428ab4db5aa59"

api_context = ApiContext.create(
    ApiEnvironmentType.SANDBOX,
    API_KEY,
    "My Hackathon App"
)

api_context.save("bunq.conf")
print("Done! bunq.conf created.")