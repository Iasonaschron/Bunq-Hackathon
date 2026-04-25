import { useState } from "react"
import Lobby from "./screens/Lobby"
import Game from "./screens/Game"
import Leaderboard from "./screens/Leaderboard"

function App() {
  const [screen, setScreen] = useState("lobby")
  const [player, setPlayer] = useState(null)

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 24 }}>
      {screen === "lobby" && (
        <Lobby onJoin={(p) => { setPlayer(p); setScreen("game") }} />
      )}
      {screen === "game" && (
        <Game player={player} onFinish={() => setScreen("leaderboard")} />
      )}
      {screen === "leaderboard" && (
        <Leaderboard onRestart={() => setScreen("lobby")} />
      )}
    </div>
  )
}

export default App
