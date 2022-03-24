import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    console.log(`Socket Event : ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_msg", (msg, room, done) => {
    socket.to(room).emit("new_msg", `${socket.nickname} : ${msg}`);
    done();
  });
  socket.on("set_nickname", (nickname, done) => {
    socket["nickname"] = nickname;
    done();
  });
  socket.on("chg_nickname", (nickname, room, done) => {
    const preNickname = socket["nickname"];
    socket["nickname"] = nickname;
    socket
      .to(room)
      .emit(
        "new_msg",
        `${preNickname} changes his/her nickname to ${socket.nickname}.`
      );
    done();
  });
});

httpServer.listen(3000, handleListen);
// const sockets = [];
// const wss = new WebSocket.Server({ server });
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anonymous";
//   socket["id"] = Date.now();
//   console.log("Connected to Browser✅");
//   sockets.forEach((aSocket) =>
//     aSocket.send(
//       `${socket.nickname} (#${socket.id}) joins Noom! Welcome to Noom😉`
//     )
//   );
//   socket.on("close", () => console.log("Disconnected from the Browser❌"));
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname} (#${socket.id}): ${message.payload}`)
//         );
//         break;
//       case "nickname":
//         sockets.forEach((aSocket) =>
//           aSocket.send(
//             `${socket.nickname} (#${socket.id}) changes his/her nickname to "${message.payload}"!`
//           )
//         );
//         socket["nickname"] = message.payload;
//         break;
//       default:
//         break;
//     }
//   });
// });
