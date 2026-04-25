import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Results.css"

const API = "http://localhost:8000"
const BET = 10

export default function Results() {
  const navigate = useNavigate()
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/scores`)
      .then(r => r.json())
      .then(d => setScores(d.scores ?? []))
      .catch(() => setScores([]))
      .finally(() => setLoading(false))
  }, [])

  function goBack() {
    fetch(`${API}/reset`, { method: "POST" }).catch(() => {})
    navigate("/chat")
  }

  if (loading) return (
    <div className="results-screen results-loading">
      <p>Calculating results...</p>
    </div>
  )

  const total = scores?.length ?? 0
  const pot = total * BET
  const topScore = scores?.[0]?.score ?? 0
  const winnerCount = scores?.filter(p => p.score === topScore).length ?? 1
  const winnerShare = pot / winnerCount
  const winnerDelta = winnerShare - BET
  const loserDelta = -BET

  const winners = scores?.filter(p => p.score === topScore) ?? []
  const losers = scores?.filter(p => p.score !== topScore) ?? []

  return (
    <div className="results-screen">
      <h1 className="results-title">Game Over</h1>

      <div className="results-section">
        <p className="results-section-label">Winners</p>
        <div className="results-list">
          {winners.map(p => (
            <div key={p.name} className="results-row results-row--winner">
              <div className="results-row-left">
                <span className="results-name">{p.name}</span>
                <span className="results-pts">{p.score} pts</span>
              </div>
              <span className="results-money results-money--win">
                +€{winnerDelta.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {losers.length > 0 && (
        <div className="results-section">
          <p className="results-section-label">Losers</p>
          <div className="results-list">
            {losers.map(p => (
              <div key={p.name} className="results-row results-row--loser">
                <div className="results-row-left">
                  <span className="results-name">{p.name}</span>
                  <span className="results-pts">{p.score} pts</span>
                </div>
                <span className="results-money results-money--loss">
                  -€{Math.abs(loserDelta).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="results-back-btn" onClick={goBack}>
        Exit
      </button>
    </div>
  )
}
