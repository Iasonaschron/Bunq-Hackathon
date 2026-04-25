Transaction Roulette — Frontend Spec
Platform
Mobile app dimensions only (375px wide). Think iPhone screen. No desktop layout needed.
Tech
React + Vite. All screens are components. No native mobile framework needed — just CSS that looks mobile.

Screen Flow
Chat Screen
    ↓ press roulette button
Bet Slider Modal
    ↓ confirm bet
Chat Screen (game card appears in chat)
    ↓ creator → redirected to Lobby immediately
    ↓ others → press "Join Game" on chat card → Lobby
Lobby Screen
    ↓ creator presses Start Game
Game Screen (6 rounds)
    ↓ all rounds done
Results Screen
    ↓ press Back to Chat
Chat Screen

Screen 1 — Chat
A group chat UI. Proof of concept only — no ability to send messages yet.
Elements:

Chat header with group name and avatars
Chat message bubbles (hardcoded/fake messages for now)
A playful roulette button (🎰) fixed at the bottom right

Tapping it opens the Bet Slider Modal



Game card in chat (appears after game is created):

Shows: "Jchro started a game of Transaction Roulette!"
Shows: bet amount per person
Shows: "Join Game" button for other players
Shows: how many players have joined so far


Screen 2 — Bet Slider Modal
Appears as a bottom sheet over the chat.
Elements:

Title: "Start a Roulette game"
Slider: €1 → €50, choose bet per person
Large display of selected amount (updates live as slider moves)
"Start Game 🎰" confirm button
On confirm: game card appears in chat, creator goes to Lobby


Screen 3 — Lobby
Waiting room before game starts.
Elements:

Title: "Waiting for players..."
List of joined players with avatars — updates as people join
Bet amount reminder: "€X per player — pot grows as people join"
Total pot display (updates as players join)
"Start Game" button — only visible to the creator
Creator can press it whenever they feel everyone is in


Screen 4 — Game (6 Rounds)
This is the main screen. Takes up the full mobile view.
Layout:
┌─────────────────────────┐
│   Round 3/6    [timer]  │
│                         │
│                         │
│   AI-generated funny    │
│   clue text here —      │
│   takes up most of      │
│   the screen. Big       │
│   font. Funny tone.     │
│                         │
│                         │
├─────────────────────────┤
│  [Ana] [Marco] [Sofia]  │
│  [Jan]                  │
└─────────────────────────┘
Round flow:

Clue text animates in (slide up or fade)
10 second countdown timer shown as a shrinking progress bar at the top
Player taps one of the name boxes at the bottom to guess
After 10 seconds (or everyone guesses): REVEAL

Correct player's box gets highlighted (green glow or shake animation)
Wrong guessers' boxes flash red briefly
Show for 3-4 seconds


Next round slides in seamlessly

Scoring:

Correct guess → +1 point
Wrong guess or no guess → 0 points (no negative scoring, keep it fun)
Running score shown on each player's name box throughout

Timer runs out with no guess:

Auto-marked as wrong
Reveal still happens


Screen 5 — Results
End of game summary.
Elements:

Winner announcement at top (big, celebratory)
Ranked leaderboard (1st to last)
AI-generated roast for each player (1 funny sentence each)
Pot transfer summary: "€X sent to [winner] from everyone"
In case of tie: pot split equally, both shown as winners
"Back to Chat 💬" button at bottom

Returns to Chat screen
Posts a result card in the chat: "Marco won Transaction Roulette and took €40 🏆"




Design Guidelines

Dark theme — feels like a night out / party game
Accent color: bunq orange (#FF8C00) for buttons and highlights
Big bold fonts for clue text — this is the hero element
Smooth animations between rounds (slide, fade)
Name boxes at bottom: rounded cards with avatar initial + name + score
Mobile width: 375px max, centered on desktop if needed
Sound effects (optional but nice): tick for timer, ding for correct, buzzer for wrong


Rules to handle in logic

Only game creator can press Start Game
Players cannot guess their own name (hide self from options or disable it)
If only 1 player joins, don't allow start
Pot = bet × number of players
Winner gets pot transferred via bunq API
Tie = pot split equally between winners