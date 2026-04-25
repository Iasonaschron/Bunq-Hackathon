from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Player:
    user_id: int
    account_id: int
    name: str
    email: str
    balance: float = 0.0
    score: int = 0
    transactions: list = field(default_factory=list)

@dataclass
class Clue:
    text: str
    correct_player_id: int
    transaction_id: Optional[str] = None

@dataclass
class Round:
    clue: Clue
    guesses: dict[int, int] = field(default_factory=dict)  # guesser_id -> guessed_player_id
    correct_count: int = 0                                  # how many correct guesses so far (for speed scoring)
    fake_guesses_scheduled: bool = False
    resolved: bool = False

@dataclass
class GameState:
    players: list[Player] = field(default_factory=list)
    pot: float = 0.0
    clues: list[Clue] = field(default_factory=list)
    rounds: list[Round] = field(default_factory=list)
    current_round: int = 0
    started: bool = False
    finished: bool = False
    preparing: bool = False

game = GameState()
