import { useNavigate, useLocation } from "react-router-dom"
import "./BottomNav.css"

const TABS = [
  { icon: "🏠", label: "Home", path: "/" },
  { icon: "💬", label: "Messages", path: "/messages" },
  { icon: "👤", label: "Profile", path: null },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function isActive(tab) {
    if (!tab.path) return false
    if (tab.path === "/messages") return pathname === "/messages" || pathname === "/group"
    return pathname === tab.path
  }

  return (
    <nav className="bn-nav">
      {TABS.map((tab) => (
        <button
          key={tab.label}
          className={[
            "bn-tab",
            isActive(tab) && "bn-tab--active",
            !tab.path && "bn-tab--disabled",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={tab.path ? () => navigate(tab.path) : undefined}
          disabled={!tab.path}
        >
          <span className="bn-icon">{tab.icon}</span>
          <span className="bn-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
