import { useState, useEffect } from "react"
import BottomNav from "../components/BottomNav"
import "./Home.css"

const FALLBACK_TXS = [
  { amount: 89.50, description: "Uber Eats", hour: 2, category: "food" },
  { amount: 340.00, description: "Nike Store", hour: 14, category: "shopping" },
  { amount: 4.50, description: "Albert Heijn", hour: 8, category: "groceries" },
  { amount: 199.00, description: "Zara", hour: 22, category: "shopping" },
]

const CATEGORY_ICON = {
  food: "🍔",
  shopping: "🛍️",
  groceries: "🛒",
  travel: "✈️",
  investment: "📈",
  beauty: "💄",
  misc: "✨",
  gaming: "🎮",
  tech: "💻",
}

function fmtHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`
}

export default function Home() {
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState(FALLBACK_TXS)

  useEffect(() => {
    let cancelled = false
    function refreshBalance() {
      fetch("http://localhost:8000/balance")
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => { if (!cancelled) setBalance(data.balance) })
        .catch(() => { if (!cancelled) setBalance((b) => b ?? false) })
    }
    refreshBalance()
    const interval = setInterval(refreshBalance, 4000)
    window.addEventListener("focus", refreshBalance)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener("focus", refreshBalance)
    }
  }, [])

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="home-greeting">
          <span className="home-greeting-text">Hey, Catrice 👋</span>
          <div className="home-avatar">C</div>
        </div>
      </header>

      <div className="home-body">
        <div className="home-balance-card">
          <span className="home-balance-label">Total Balance</span>
          {balance === null ? (
            <div className="home-spinner" />
          ) : (
            <span className="home-balance-amount">
              {balance === false ? "—" : `€ ${balance.toFixed(2)}`}
            </span>
          )}
          <span className="home-balance-sub">bunq · Catrice Elizabeth</span>
        </div>

        <div className="home-actions">
          <button className="home-action-btn">💸 Send</button>
          <button className="home-action-btn">📥 Request</button>
        </div>

        <div className="home-section">
          <span className="home-section-title">Recent Transactions</span>
          <div className="home-tx-list">
            {transactions.map((tx, i) => (
              <div key={i} className="home-tx-row">
                <div className="home-tx-icon">
                  {CATEGORY_ICON[tx.category] ?? "💳"}
                </div>
                <div className="home-tx-info">
                  <span className="home-tx-name">{tx.description}</span>
                  <span className="home-tx-meta">
                    {tx.category} · {fmtHour(tx.hour)}
                  </span>
                </div>
                <span className="home-tx-amount">−€{tx.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
