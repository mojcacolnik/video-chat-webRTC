const express = require("express");
const socket = require("socket.io");
const app = express();

let server = app.listen(4000, () => {
  console.log("Server running!");
});

app.use(express.static("public"));

const io = socket(server);

io.on("connection", (socket) => {
  console.log("User Connected: ", socket.id);

  socket.on("join", (roomName) => {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);
    if (room === undefined) {
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size === 1) {
      socket.join(roomName);
      socket.emit("joined");
    } else {
      socket.emit("full");
    }
  });

  socket.on("ready", (roomName) => {
    socket.broadcast.to(roomName).emit("ready");
  });

  // exchange of ICE candidates
  socket.on("candidate", (candidate, roomName) => {
    socket.broadcast.to(roomName).emit(candidate, "candidate");
  });

  // offer
  socket.on("offer", (offer, roomName) => {
    socket.broadcast.to(roomName).emit(offer, "offer");
  });

  // answer
  socket.on("answer", (answer, roomName) => {
    socket.broadcast.to(roomName).emit(answer, "answer");
  });
});
