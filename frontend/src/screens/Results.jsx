import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Results.css"

const API = "http://localhost:8000"
const MEDALS = ["🥇", "🥈", "🥉"]

export default function Results() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/leaderboard`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  async function goBack() {
    await fetch(`${API}/reset`, { method: "POST" }).catch(() => {})
    navigate("/chat")
  }

  if (loading) return (
    <div className="results-screen results-loading">
      <p>Generating roasts... 🔥</p>
    </div>
  )

  const winner = data?.scores?.[0]
  const scores = data?.scores ?? []
  const roasts = data?.roasts ?? {}

  return (
    <div className="results-screen">
      <div className="results-winner">
        <div className="results-trophy">🏆</div>
        <h1 className="results-winner-name">{winner?.name} wins!</h1>
        <p className="results-winner-score">{winner?.score} correct guesses</p>
      </div>

      <div className="results-list">
        {scores.map((p, i) => (
          <div key={p.name} className="results-row">
            <span className="results-medal">{MEDALS[i] ?? "  "}</span>
            <div className="results-player-info">
              <span className="results-player-name">{p.name}</span>
              <span className="results-roast">"{roasts[p.name]}"</span>
            </div>
            <span className="results-score">{p.score}pts</span>
          </div>
        ))}
      </div>

      <button className="results-back-btn" onClick={goBack}>
        Back to Chat 💬
      </button>
    </div>
  )
}
