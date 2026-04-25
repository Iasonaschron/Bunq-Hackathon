import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "./Game.css"

const API = `http://${window.location.hostname}:8000`
const TOTAL_ROUNDS = 6
const TIMER_SECONDS = 10

const ME = { name: "Catrice", player_id: 3628850 }
const BOT_PLAYERS = [
  { name: "Marco", user_id: 1002 },
  { name: "Sofia", user_id: 1003 },
  { name: "Jan",   user_id: 1004 },
]
const COLORS = { Catrice: "#2ECC71", Marco: "#e8855a", Sofia: "#a78bfa", Jan: "#60a5fa" }

export default function Game() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const fromLobby = !!state?.player

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
  const [hasGuessed, setHasGuessed] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const guessable = [{ name: ME.name, user_id: ME.player_id }, ...BOT_PLAYERS]

  const [ready, setReady] = useState(fromLobby)
  const initRef = useRef(false)
  const timerRef = useRef(null)
  const pollRef = useRef(null)
  const guessedRef = useRef(false)
  const prevScoresRef = useRef({})
  const roundRef = useRef(0)

  // Fallback init if user lands on /game directly (no Lobby flow)
  useEffect(() => {
    if (fromLobby || initRef.current) return
    initRef.current = true
    ;(async () => {
      try {
        await fetch(`${API}/reset`, { method: "POST" })
        await fetch(`${API}/prepare`, { method: "POST" })
        await fetch(`${API}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: ME.name }),
        })
        await fetch(`${API}/start`, { method: "POST" })
      } catch {}
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    roundRef.current = round
    if (!ready) return
    if (round >= TOTAL_ROUNDS) {
      navigate("/results")
      return
    }
    startRound()
    return () => {
      clearInterval(timerRef.current)
      clearInterval(pollRef.current)
    }
  }, [round, ready])

  async function startRound() {
    clearInterval(timerRef.current)
    clearInterval(pollRef.current)
    setLoading(true)
    setRevealed(false)
    setGuessResult(null)
    setRoundStatus([])
    setShowLeaderboard(false)
    setHasGuessed(false)
    setSelectedId(null)
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
    if (roundIdx >= TOTAL_ROUNDS) return
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
            guesser_id: ME.player_id,
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
        clearInterval(timerRef.current)
        clearInterval(pollRef.current)
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
    setSelectedId(targetPlayer?.user_id ?? -1)

    try {
      const r = await fetch(`${API}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guesser_id: ME.player_id,
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
            ? `Correct! +${guessResult.points_earned}pts — it was ${guessable.find(p => p.user_id === guessResult.correct_player_id)?.name}`
            : `Wrong — it was ${guessable.find(p => p.user_id === guessResult.correct_player_id)?.name}`
          }
        </div>
      )}

      <div className="game-players">
        {guessable.map((p) => {
          const status = roundStatus.find(s => s.player_id === p.user_id)
          const isAnswer = revealed && guessResult && p.user_id === guessResult.correct_player_id
          const isSelected = selectedId === p.user_id
          const isDimmed = hasGuessed && !revealed && !isSelected
          return (
            <button
              key={p.user_id}
              className={`player-btn ${isAnswer ? "player-btn--correct" : ""} ${isSelected ? "player-btn--selected" : ""} ${isDimmed ? "player-btn--dimmed" : ""}`}
              style={{ "--player-color": COLORS[p.name] ?? "#888" }}
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
              <div key={s.name} className={`mid-lb-row${s.name === ME.name ? " mid-lb-row--me" : ""}`}>
                <span className="mid-lb-rank">#{i + 1}</span>
                <span className="mid-lb-name">{s.name}{s.name === ME.name ? " (you)" : ""}</span>
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
