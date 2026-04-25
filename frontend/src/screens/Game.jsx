import { useState, useEffect } from "react"

const API = "http://localhost:8000"

const DUMMY_PLAYERS = [
  { player_id: 1001, name: "Alice" },
  { player_id: 1002, name: "Bob" },
  { player_id: 1003, name: "Carlos" },
  { player_id: 1004, name: "Diana" },
]

export default function Game({ player, onFinish }) {
  const [clue, setClue] = useState(null)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClue()
  }, [round])

  async function fetchClue() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API}/clue`)
      const data = await res.json()
      setClue(data.clue)
    } catch {
      setClue("Failed to load clue.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGuess(guessedId) {
    const res = await fetch(`${API}/guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guesser_id: player?.player_id ?? 0, guessed_player_id: guessedId }),
    })
    const data = await res.json()
    setResult(data)
  }

  return (
    <div>
      <h1>🎰 Round {round + 1}</h1>
      {loading ? (
        <p>Loading clue...</p>
      ) : (
        <>
          <p style={{ fontSize: 20, fontWeight: "bold" }}>{clue}</p>
          <p>Who do you think this is?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DUMMY_PLAYERS.map((p) => (
              <button
                key={p.player_id}
                onClick={() => handleGuess(p.player_id)}
                disabled={!!result}
                style={{ padding: "10px 16px", fontSize: 16 }}
              >
                {p.name}
              </button>
            ))}
          </div>
          {result && (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: result.correct ? "green" : "red", fontWeight: "bold" }}>
                {result.correct ? "Correct! 🎉" : "Wrong! 😬"}
              </p>
              <button onClick={onFinish} style={{ padding: "10px 24px", marginTop: 8 }}>
                See Leaderboard
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
