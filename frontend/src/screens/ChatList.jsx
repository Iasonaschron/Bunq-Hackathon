import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav"
import "./ChatList.css"

const CHATS = [
  {
    id: "group",
    name: "Sky Trip",
    members: "Marco, Sofia, Jan, Catrice",
    preview: "omg who did that",
    time: "now",
    pinned: true,
    clickable: true,
    avatarBg: "#2ECC71",
    avatarLabel: "ST",
    unread: true,
  },
  {
    id: "marco",
    name: "Marco",
    preview: "bro I'm not paying that",
    time: "22:14",
    clickable: false,
    avatarBg: "#e8855a",
    avatarLabel: "M",
  },
  {
    id: "sofia",
    name: "Sofia",
    preview: "it was NOT me lmaooo",
    time: "22:09",
    clickable: false,
    avatarBg: "#a78bfa",
    avatarLabel: "S",
  },
  {
    id: "jan",
    name: "Jan",
    preview: "statistically speaking...",
    time: "21:58",
    clickable: false,
    avatarBg: "#60a5fa",
    avatarLabel: "J",
  },
]

export default function ChatList() {
  const navigate = useNavigate()

  return (
    <div className="cl-screen">
      <header className="cl-header">
        <span className="cl-title">Messages</span>
      </header>

      <div className="cl-body">
        {CHATS.map((chat) => (
          <div
            key={chat.id}
            className={[
              "cl-item",
              chat.pinned && "cl-item--pinned",
              chat.clickable ? "cl-item--clickable" : "cl-item--static",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={chat.clickable ? () => navigate("/group") : undefined}
            role={chat.clickable ? "button" : undefined}
          >
            <div className="cl-avatar" style={{ background: chat.avatarBg }}>
              {chat.avatarLabel}
            </div>

            <div className="cl-content">
              <div className="cl-top">
                <div className="cl-name-block">
                  <span className="cl-name">{chat.name}</span>
                  {chat.members && <span className="cl-members">{chat.members}</span>}
                </div>
                <span className="cl-time">{chat.time}</span>
              </div>
              <div className="cl-bottom">
                <span
                  className={[
                    "cl-preview",
                    chat.unread && "cl-preview--bold",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {chat.preview}
                </span>
                {chat.unread && <span className="cl-unread-dot" />}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
