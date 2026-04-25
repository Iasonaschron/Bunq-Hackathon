import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Chat from "./screens/Chat"
import Lobby from "./screens/Lobby"
import Game from "./screens/Game"
import Results from "./screens/Results"

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/chat" element={<Chat />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
