import { useState } from "react"

const API = "http://localhost:8000"

export default function Lobby({ onJoin }) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [status, setStatus] = useState("")

  async function handleJoin() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      setStatus("Joining game...")
      const joinRes = await fetch(`${API}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const player = await joinRes.json()

      setStatus("Generating clues with AI... (this takes ~10s)")
      const startRes = await fetch(`${API}/start`, { method: "POST" })
      if (!startRes.ok) {
        const err = await startRes.json()
        // "already started" is fine — just proceed
        if (!err.detail?.includes("already started")) {
          throw new Error(err.detail || "Failed to start game")
        }
      }

      onJoin(player)
    } catch (e) {
      setError(e.message || "Could not connect to server.")
    } finally {
      setLoading(false)
      setStatus("")
    }
  }

  return (
    <div>
      <h1>🎰 Transaction Roulette</h1>
      <p>Enter your name to join the game. Everyone puts €10 in the pot.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        placeholder="Your name"
        style={{ padding: 8, fontSize: 16, width: "100%", marginBottom: 12 }}
      />
      <br />
      <button onClick={handleJoin} disabled={loading} style={{ padding: "10px 24px", fontSize: 16 }}>
        {loading ? "Please wait..." : "Join Game"}
      </button>
      {status && <p style={{ color: "#555", marginTop: 12 }}>{status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}
