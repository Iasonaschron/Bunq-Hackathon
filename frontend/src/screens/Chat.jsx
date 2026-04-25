import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Chat.css"

const ME = "Catrice"

const MESSAGES = [
  { id: 1,  sender: "Marco",   text: "guys it's friday night what are we doing",   time: "21:04" },
  { id: 2,  sender: "Sofia",   text: "idk but I'm bored",                           time: "21:05" },
  { id: 3,  sender: ME,        text: "let's do something stupid with our money",    time: "21:06" },
  { id: 4,  sender: "Jan",     text: "..like what",                                  time: "21:06" },
  { id: 5,  sender: "Marco",   text: "transaction roulette??? 👀",                  time: "21:07" },
  { id: 6,  sender: "Sofia",   text: "LMAOOO yes please",                           time: "21:07" },
  { id: 7,  sender: ME,        text: "I am NOT losing money to Jan again",          time: "21:08" },
  { id: 8,  sender: "Jan",     text: "skill issue",                                  time: "21:08" },
  { id: 9,  sender: ME,        text: "ok fine I'll start one, who's in",            time: "21:09" },
  { id: 10, sender: "Marco",   text: "IN",                                           time: "21:09" },
  { id: 11, sender: "Sofia",   text: "same",                                         time: "21:09" },
  { id: 12, sender: ME,        text: "let's go 🎰",                                 time: "21:10" },
]

const AVATARS = { Marco: "M", Sofia: "S", Catrice: "C", Jan: "J" }
const COLORS  = { Marco: "#e8855a", Sofia: "#a78bfa", Catrice: "#00D166", Jan: "#60a5fa" }

export default function Chat() {
  const [modalOpen, setModalOpen] = useState(false)
  const [bet, setBet] = useState(10)
  const navigate = useNavigate()

  function confirmBet() {
    setModalOpen(false)
    navigate("/lobby", { state: { player: { name: ME }, bet } })
  }

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="chat-header-avatars">
          {Object.entries(COLORS).slice(0, 4).map(([name, color]) => (
            <div key={name} className="avatar-sm" style={{ background: color }}>
              {AVATARS[name]}
            </div>
          ))}
        </div>
        <div className="chat-header-info">
          <span className="chat-group-name">Friday crew 🍻</span>
          <span className="chat-member-count">5 members</span>
        </div>
      </div>

      <div className="chat-messages">
        {MESSAGES.map((msg) => {
          const isMe = msg.sender === ME
          return (
            <div key={msg.id} className={`msg-row ${isMe ? "msg-row--me" : ""}`}>
              {!isMe && (
                <div className="avatar-sm" style={{ background: COLORS[msg.sender] ?? "#666" }}>
                  {AVATARS[msg.sender] ?? msg.sender[0]}
                </div>
              )}
              <div className="msg-col">
                {!isMe && <span className="msg-sender" style={{ color: COLORS[msg.sender] }}>{msg.sender}</span>}
                <div className={`bubble ${isMe ? "bubble--me" : "bubble--them"}`}>{msg.text}</div>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button className="fab" onClick={() => setModalOpen(true)}>🎰</button>

      {modalOpen && (
        <div className="sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">Start a Roulette game</h2>
            <div className="sheet-amount">€{bet}</div>
            <input
              type="range" min={1} max={10} value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              className="sheet-slider"
            />
            <div className="sheet-labels"><span>€1</span><span>€10</span></div>
            <button className="sheet-confirm" onClick={confirmBet}>
              Start Game 🎰
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
