import { useState, useEffect } from "react"

const API = "http://localhost:8000"

export default function Leaderboard({ onRestart }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`${API}/leaderboard`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ scores: [], roast: "Could not load results." }))
  }, [])

  if (!data) return <p>Loading results...</p>

  return (
    <div>
      <h1>🏆 Leaderboard</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ccc" }}>Player</th>
            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #ccc" }}>Score</th>
            <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #ccc" }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.scores.map((s, i) => (
            <tr key={i}>
              <td style={{ padding: 8 }}>{i === 0 ? "🥇 " : ""}{s.name}</td>
              <td style={{ textAlign: "right", padding: 8 }}>{s.score}</td>
              <td style={{ textAlign: "right", padding: 8 }}>€{s.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>🔥 AI Roast</h2>
      <p style={{ fontStyle: "italic" }}>{data.roast}</p>
      <button onClick={onRestart} style={{ padding: "10px 24px", marginTop: 16 }}>
        Play Again
      </button>
    </div>
  )
}
