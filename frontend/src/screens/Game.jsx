import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./Game.css"

const API = "http://localhost:8000"
const TOTAL_ROUNDS = 5
const TIMER_SECONDS = 10

const GUESSABLE = [
  { name: "Catrice", user_id: 3628850 },
  { name: "Marco",   user_id: 1002 },
  { name: "Sofia",   user_id: 1003 },
  { name: "Jan",     user_id: 1004 },
]
const COLORS = { Catrice: "#34d399", Marco: "#e8855a", Sofia: "#a78bfa", Jan: "#60a5fa" }

export default function Game() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const player = state?.player

  const [round, setRound] = useState(0)
  const [clue, setClue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [guessResult, setGuessResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [roundStatus, setRoundStatus] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [midScores, setMidScores] = useState([])
  const [scoreDeltas, setScoreDeltas] = useState({})
  const [hasGuessed, setHasGuessed] = useState(false)  // local player submitted

  const timerRef = useRef(null)
  const pollRef = useRef(null)
  const guessedRef = useRef(false)
  const prevScoresRef = useRef({})
  const roundRef = useRef(0)

  useEffect(() => {
    roundRef.current = round
    startRound()
    return () => {
      clearInterval(timerRef.current)
      clearInterval(pollRef.current)
    }
  }, [round])

  async function startRound() {
    clearInterval(timerRef.current)
    clearInterval(pollRef.current)
    setLoading(true)
    setRevealed(false)
    setGuessResult(null)
    setRoundStatus([])
    setShowLeaderboard(false)
    setHasGuessed(false)
    guessedRef.current = false
    setTimeLeft(TIMER_SECONDS)

    try {
      const r = await fetch(`${API}/scores`)
      const d = await r.json()
      const snap = {}
      d.scores.forEach(s => { snap[s.name] = s.score })
      prevScoresRef.current = snap
    } catch {}

    try {
      const r = await fetch(`${API}/clue`)
      const d = await r.json()
      setClue(d.clue)
    } catch {
      setClue("Failed to load clue.")
    }
    setLoading(false)
  }

  // Start timer + polling once clue is loaded
  useEffect(() => {
    if (loading) return

    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          onTimerExpired()
          return 0
        }
        return t - 1
      })
    }, 1000)

    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      fetchRoundStatus(roundRef.current)
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(pollRef.current)
    }
  }, [loading])

  async function fetchRoundStatus(roundIdx) {
    try {
      const r = await fetch(`${API}/round-status?round=${roundIdx}`)
      if (!r.ok) return
      const d = await r.json()
      setRoundStatus(d.guesses ?? [])
    } catch {}
  }

  // Called when timer hits zero — sends guess (or no-guess) and triggers reveal
  async function onTimerExpired() {
    clearInterval(pollRef.current)
    const currentRound = roundRef.current

    // Submit guess to backend if not already done
    if (!guessedRef.current) {
      guessedRef.current = true
      try {
        const r = await fetch(`${API}/guess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guesser_id: player?.player_id ?? 9999,
            guessed_player_id: -1,  // no guess = wrong
          }),
        })
        const data = await r.json()
        setGuessResult(data)
      } catch {
        setGuessResult({ correct: false, correct_player_id: -1, points_earned: 0 })
      }
    }

    // Final round-status fetch then reveal
    await fetchRoundStatus(currentRound)
    setRevealed(true)

    // Show leaderboard after 2.5s
    setTimeout(async () => {
      try {
        const r = await fetch(`${API}/scores`)
        const d = await r.json()
        const deltas = {}
        d.scores.forEach(s => {
          deltas[s.name] = s.score - (prevScoresRef.current[s.name] ?? 0)
        })
        setMidScores(d.scores)
        setScoreDeltas(deltas)
      } catch {}

      setShowLeaderboard(true)

      setTimeout(() => {
        if (currentRound + 1 >= TOTAL_ROUNDS) {
          navigate("/results")
        } else {
          setRound(r => r + 1)
        }
      }, 3000)
    }, 2500)
  }

  // Player taps a name — locks in their guess but does NOT stop timer
  async function submitGuess(targetPlayer) {
    if (guessedRef.current || revealed) return
    guessedRef.current = true
    setHasGuessed(true)

    try {
      const r = await fetch(`${API}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guesser_id: player?.player_id ?? 9999,
          guessed_player_id: targetPlayer?.user_id ?? -1,
        }),
      })
      const data = await r.json()
      setGuessResult(data)
    } catch {
      setGuessResult({ correct: false, correct_player_id: -1, points_earned: 0 })
    }
    // Timer keeps running — reveal happens in onTimerExpired
  }

  const progress = (timeLeft / TIMER_SECONDS) * 100

  return (
    <div className="game-screen">
      <div className="game-topbar">
        <span className="game-round-label">Round {round + 1}/{TOTAL_ROUNDS}</span>
        <span className={`game-timer ${timeLeft <= 3 ? "game-timer--urgent" : ""}`}>{timeLeft}s</span>
      </div>

      <div className="game-progress-track">
        <div
          className={`game-progress-fill ${timeLeft <= 3 ? "game-progress-urgent" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="game-clue-area">
        {loading
          ? <p className="game-loading">Loading clue...</p>
          : <p className="game-clue-text game-clue-in">{clue}</p>
        }
      </div>

      {revealed && guessResult && (
        <div className={`game-result-banner ${guessResult.correct ? "game-result-correct" : "game-result-wrong"}`}>
          {guessResult.correct
            ? `Correct! +${guessResult.points_earned}pts 🎉 — it was ${GUESSABLE.find(p => p.user_id === guessResult.correct_player_id)?.name}`
            : `Wrong 😬 — it was ${GUESSABLE.find(p => p.user_id === guessResult.correct_player_id)?.name}`
          }
        </div>
      )}

      <div className="game-players">
        {GUESSABLE.map((p) => {
          const status = roundStatus.find(s => s.player_id === p.user_id)
          const isAnswer = revealed && guessResult && p.user_id === guessResult.correct_player_id
          return (
            <button
              key={p.user_id}
              className={`player-btn ${isAnswer ? "player-btn--correct" : ""} ${hasGuessed && !revealed ? "player-btn--locked" : ""}`}
              style={{ "--player-color": COLORS[p.name] }}
              onClick={() => submitGuess(p)}
              disabled={hasGuessed || revealed || loading}
            >
              <div className="player-btn-top">
                <span className="player-btn-avatar">{p.name[0]}</span>
                {status?.has_guessed && <span className="player-guessed-dot" />}
              </div>
              <span className="player-btn-name">{p.name}</span>
            </button>
          )
        })}
      </div>

      {showLeaderboard && (
        <div className="mid-leaderboard">
          <p className="mid-lb-subtitle">After round {round + 1}</p>
          <div className="mid-lb-list">
            {midScores.map((s, i) => (
              <div key={s.name} className="mid-lb-row">
                <span className="mid-lb-rank">#{i + 1}</span>
                <span className="mid-lb-name">{s.name}</span>
                <div className="mid-lb-right">
                  <span className="mid-lb-score">{s.score}pts</span>
                  {scoreDeltas[s.name] > 0 && (
                    <span className="mid-lb-delta">+{scoreDeltas[s.name]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
