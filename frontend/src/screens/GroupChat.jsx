import { useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import "./GroupChat.css"

const API = `http://${window.location.hostname}:8000`

const MESSAGES = [
  { id: 1, sender: "Marco", text: "guys who booked the most expensive airbnb AGAIN", time: "21:44" },
  { id: 2, sender: "Sofia", text: "don't look at me I got a DEAL on sephora ok", time: "21:45" },
  { id: 3, sender: "Jan", text: "statistically someone here has a spending problem and it's not me", time: "21:46" },
  { id: 4, sender: "Catrice", text: "Jan you bought a GPU at 2am", time: "21:46" },
  { id: 5, sender: "Jan", text: "that was an investment", time: "21:47" },
  { id: 6, sender: "Marco", text: "bro crypto at 3am is also an investment right", time: "21:48" },
  { id: 7, sender: "Sofia", text: "omg who did that", time: "21:49" },
  { id: 8, sender: "Catrice", text: "we need to sort this out PROPERLY", time: "21:50" },
]

const AVATAR_COLORS = {
  Marco: "#e8855a",
  Sofia: "#a78bfa",
  Jan: "#60a5fa",
  Catrice: "#2ECC71",
}

const AVATAR_LABELS = {
  Marco: "M",
  Sofia: "S",
  Jan: "J",
  Catrice: "C",
}

export default function GroupChat() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [bet, setBet] = useState(10)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  function openBetModal() {
    setError(null)
    setModalOpen(true)
  }

  async function confirmBet() {
    setChecking(true)
    setError(null)
    try {
      const r = await fetch(`${API}/can-afford?amount=${bet}`)
      if (!r.ok) throw new Error("Could not check balance")
      const d = await r.json()
      if (!d.can_afford) {
        setError(`Insufficient balance (€${d.balance.toFixed(2)} available)`)
        return
      }
      setModalOpen(false)
      navigate("/lobby", { state: { player: { name: "Catrice" }, bet } })
    } catch (e) {
      setError(e.message || "Could not check balance")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="gc-screen">
      <header className="gc-header">
        <button className="gc-back" onClick={() => navigate("/messages")} aria-label="Back">
          ‹
        </button>
        <div className="gc-header-info">
          <span className="gc-header-name">Sky Trip</span>
          <span className="gc-header-members">Marco, Sofia, Jan, Catrice</span>
        </div>
      </header>

      <div className="gc-messages">
        {MESSAGES.map((msg) => (
          <div key={msg.id} className="gc-row">
            <div
              className="gc-avatar"
              style={{ background: AVATAR_COLORS[msg.sender] }}
            >
              {AVATAR_LABELS[msg.sender]}
            </div>
            <div className="gc-bubble-wrap">
              <span className="gc-sender">{msg.sender}</span>
              <div className="gc-bubble">
                <span className="gc-text">{msg.text}</span>
                <span className="gc-time">{msg.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="gc-footer">
        <button className="gc-play-btn" onClick={openBetModal}>
          Play Transaction Roulette
        </button>
        <div className="gc-input-row">
          <input className="gc-input" type="text" placeholder="Message" readOnly />
          <button className="gc-send-btn">↑</button>
        </div>
      </div>

      {modalOpen && (
        <div className="gc-sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="gc-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="gc-sheet-handle" />
            <h2 className="gc-sheet-title">Start a Roulette game</h2>
            <div className="gc-sheet-amount">€{bet}</div>
            <input
              type="range" min={1} max={10} value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="gc-sheet-slider"
            />
            <div className="gc-sheet-labels"><span>€1</span><span>€10</span></div>
            {error && <p className="gc-error">{error}</p>}
            <button className="gc-sheet-confirm" onClick={confirmBet} disabled={checking}>
              {checking ? "Checking balance..." : "Start Game"}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
