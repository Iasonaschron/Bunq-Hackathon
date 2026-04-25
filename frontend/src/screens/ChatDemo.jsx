import { useNavigate } from "react-router-dom"
import "./ChatDemo.css"

const CHATS = [
  {
    id: "friday",
    name: "Friday crew",
    avatar: "F",
    time: "21:10",
    message: "Catrice: let's go",
    unread: 4,
    opensChat: true,
  },
  {
    id: "house",
    name: "Housemates",
    avatar: "H",
    time: "19:42",
    message: "Jan: who left dishes again",
    unread: 1,
  },
  {
    id: "work",
    name: "Hackathon team",
    avatar: "T",
    time: "18:05",
    message: "Marco: backend is almost alive",
    unread: 0,
  },
  {
    id: "family",
    name: "Family",
    avatar: "K",
    time: "Yesterday",
    message: "Mom: eat something normal today",
    unread: 2,
  },
]

export default function ChatDemo() {
  const navigate = useNavigate()

  function openChat(chat) {
    if (chat.opensChat) {
      navigate("/chat")
    }
  }

  return (
    <div className="chat-demo-screen">
      <header className="chat-demo-header">
        <h1>Chats</h1>
      </header>

      <div className="chat-preview-list">
        {CHATS.map((chat) => (
          <button
            key={chat.id}
            className={`chat-preview ${chat.opensChat ? "chat-preview--active" : ""}`}
            onClick={() => openChat(chat)}
            type="button"
          >
            <span className="chat-preview-avatar">{chat.avatar}</span>
            <span className="chat-preview-body">
              <span className="chat-preview-top">
                <span className="chat-preview-name">{chat.name}</span>
                <span className="chat-preview-time">{chat.time}</span>
              </span>
              <span className="chat-preview-message">{chat.message}</span>
            </span>
            {chat.unread > 0 && <span className="chat-preview-unread">{chat.unread}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
