import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";
const SERVER_URL = "http://localhost:3000";

export default function App() {
  // ——————————————————————
  // refs & state
  // ——————————————————————
  const socketRef = useRef(null);
  const [room, setRoom]       = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState("");
  const [online, setOnline]   = useState(0);
  const endRef = useRef();

  // ——————————————————————
  // socket setup (only once!)
  // ——————————————————————
  useEffect(() => {
    if (!socketRef.current) {
      const sock = io(SERVER_URL, { transports: ["websocket"] });
      socketRef.current = sock;

      // online count
      sock.on("onlineCount", (count) => setOnline(count));

      // matched into a room
      sock.on("matched", ({ room }) => {
        setRoom(room);
        pushMsg("System", "🔗 You are now connected. Say hi!");
      });

      // incoming from stranger
      sock.on("message", ({ text }) => {
        pushMsg("Stranger", text);
      });
    }

    // cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ——————————————————————
  // helper: add & scroll
  // ——————————————————————
  const pushMsg = (sender, text) => {
    setMessages((m) => [...m, { sender, text }]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // ——————————————————————
  // UI actions
  // ——————————————————————
  const startChat = () => {
    socketRef.current.emit("findMatch");
  };

  const sendMessage = () => {
    if (!input.trim() || !room) return;
    socketRef.current.emit("message", { room, text: input });
    pushMsg("You", input);
    setInput("");
  };

  // ——————————————————————
  // render
  // ——————————————————————
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>RandomChat</h1>
        <span className="online-count">{online} online</span>
      </header>

      <div className="body">
        <aside className="sidebar">
          <h2>Connection</h2>
          <div className={`status ${room ? "connected" : "disconnected"}`}>
            {room ? "Connected" : "Disconnected"}
          </div>
          <button onClick={startChat}>Start Chatting</button>

          <div className="tips">
            <h3>Safety Tips</h3>
            <ul>
              <li>Don't share personal information</li>
              <li>Be respectful</li>
              <li>Report bad behavior</li>
              <li>Have fun!</li>
            </ul>
          </div>
        </aside>

        <main className="main-panel">
          <div className="chat-card">
            <div className="card-header">
              <span>💬 Chat Room</span>
            </div>
            <div className="card-body">
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="icon-large">💬</div>
                  <h2>Welcome to RandomChat</h2>
                  <p>Click “Start Chatting” to begin.</p>
                </div>
              ) : (
                <div className="chat-window">
                  {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.sender.toLowerCase()}`}>
                      <strong>{m.sender}:</strong> {m.text}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>
          </div>

          <div className="input-row">
            <input
              disabled={!room}
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={!room || !input.trim()}>
              ➤
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
