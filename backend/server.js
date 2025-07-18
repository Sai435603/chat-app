const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

let waitingQueue = [];

io.on('connection', socket => {
  console.log('User connected:', socket.id);
  waitingQueue.push(socket);

  // Try to match
  if (waitingQueue.length >= 2) {
    const [user1, user2] = waitingQueue.splice(0, 2);
    const room = `room-${user1.id}-${user2.id}`;
    user1.join(room);
    user2.join(room);
    // Notify matched
    user1.emit('matched', { room });
    user2.emit('matched', { room });
  }

  socket.on('message', ({ room, text }) => {
    // Broadcast to the other in room
    socket.to(room).emit('message', { text });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove from waitingQueue if not matched
    waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));