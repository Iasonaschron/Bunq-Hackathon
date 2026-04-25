import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ChatDemo from "./screens/ChatDemo"
import ChatList from "./screens/ChatList"
import GroupChat from "./screens/GroupChat"
import Home from "./screens/Home"
import BillSplitter from "./screens/BillSplitter"
import Lobby from "./screens/Lobby"
import Game from "./screens/Game"
import Results from "./screens/Results"

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<ChatList />} />
          <Route path="/group" element={<GroupChat />} />
          <Route path="/split" element={<BillSplitter />} />
          <Route path="/demo" element={<ChatDemo />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/results" element={<Results />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
