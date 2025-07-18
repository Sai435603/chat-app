import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const sock = io(SERVER_URL);
    setSocket(sock);

    sock.on("matched", ({ room }) => {
      setRoom(room);
      addMessage("System", "You are now connected. Say hi!");
    });

    sock.on("message", ({ text }) => {
      addMessage("Stranger", text);
    });

    return () => sock.disconnect();
  }, []);

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  };

  const sendMessage = () => {
    if (input.trim() && room) {
      socket.emit("message", { room, text: input });
      addMessage("You", input);
      setInput("");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Random Chat</h1>
      <div className="border p-2 h-64 overflow-auto mb-2">
        {messages.map((m, i) => (
          <div key={i}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button className="ml-2 p-2 border" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
