import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./Lobby.css"

const API = "http://localhost:8000"

const ME = "Catrice"
const BOTS = ["Marco", "Sofia", "Jan"]
const COLORS = { Marco: "#e8855a", Sofia: "#a78bfa", Catrice: "#00D166", Jan: "#60a5fa" }

function randDelay(min, max) {
  return min + Math.random() * (max - min)
}

export default function Lobby() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(state?.player)
  const bet = state?.bet ?? 10
  const initDone = useRef(false)

  // Start with only the human player visible
  const [joined, setJoined] = useState([ME])
  const [newlyJoined, setNewlyJoined] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pot = bet * (joined.length)

  // Reset, kick off clue generation, then re-join the human player
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    const name = state?.player?.name ?? ME
    fetch(`${API}/reset`, { method: "POST" })
      .then(() => fetch(`${API}/prepare`, { method: "POST" }))
      .then(() => fetch(`${API}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }))
      .then(r => r.json())
      .then(p => setPlayer(p))
      .catch(() => {})
  }, [])

  // Trickle in fake players one by one
  useEffect(() => {
    let cancelled = false
    async function trickle() {
      for (const bot of BOTS) {
        const delay = randDelay(400, 1000)
        await new Promise(r => setTimeout(r, delay))
        if (cancelled) return
        setJoined(prev => [...prev, bot])
        setNewlyJoined(bot)
        setTimeout(() => setNewlyJoined(null), 800)
      }
    }
    trickle()
    return () => { cancelled = true }
  }, [])

  async function startGame() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/start`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        if (!err.detail?.includes("already started")) throw new Error(err.detail)
      }
      navigate("/game", { state: { player } })
    } catch (e) {
      setError(e.message || "Failed to start game")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lobby-screen">
      <h1 className="lobby-title">Waiting for players...</h1>
      <p className="lobby-bet-info">€{bet} per player</p>

      <div className="lobby-pot">
        <span className="lobby-pot-label">Total pot</span>
        <span className="lobby-pot-amount">€{pot}</span>
      </div>

      <div className="lobby-players">
        {joined.map((name) => (
          <div
            key={name}
            className={`lobby-player-row ${newlyJoined === name ? "lobby-player-row--new" : ""}`}
          >
            <div className="avatar-md" style={{ background: COLORS[name] ?? "#555" }}>
              {name[0]}
            </div>
            <span className="lobby-player-name">{name}</span>
            <span className="lobby-player-joined">✓</span>
          </div>
        ))}
      </div>

      {error && <p className="lobby-error">{error}</p>}

      <button className="lobby-start-btn" onClick={startGame} disabled={loading}>
        {loading ? "Starting..." : "Start Game 🎰"}
      </button>
    </div>
  )
}
