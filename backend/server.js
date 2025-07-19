// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// Allow React client at http://localhost:3000 (or change if yours is on 3001)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let waiting = [];
let onlineCount = 0;

io.on("connection", (socket) => {
  // 1) update & broadcast online count
  onlineCount++;
  io.emit("onlineCount", onlineCount);

  // 2) handle “Start Chatting”
  socket.on("findMatch", () => {
    if (waiting.length > 0) {
      const peer = waiting.shift();
      const room = `room-${socket.id}-${peer.id}`;

      socket.join(room);
      peer.join(room);

      socket.emit("matched", { room });
      peer.emit("matched", { room });
    } else {
      waiting.push(socket);
    }
  });

  // 3) relay messages within room
  socket.on("message", ({ room, text }) => {
    socket.to(room).emit("message", { text });
  });

  // 4) cleanup on disconnect
  socket.on("disconnect", () => {
    onlineCount--;
    io.emit("onlineCount", onlineCount);

    // remove from queue if waiting
    waiting = waiting.filter((s) => s.id !== socket.id);
  });
});

// simple health‑check
app.get("/", (_req, res) => res.send("✅ Server is up"));

server.listen(PORT, () => {
  console.log(`🚀 Listening on http://localhost:${PORT}`);
});
