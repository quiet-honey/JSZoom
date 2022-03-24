const socket = io();

const nickname = document.querySelector("#nickname");
const nickForm = nickname.querySelector("form");
const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("#room");

welcome.hidden = true;
room.hidden = true;
let roomName;
let userNickname;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  const chgForm = room.querySelector("#change");
  msgForm.addEventListener("submit", handleMsgSubmit);
  chgForm.addEventListener("submit", handleNicknameChg);
}
function showServer() {
  welcome.hidden = false;
  nickname.hidden = true;
  alert(
    `Your nickname is "${userNickname}"!\nWelcome to Noom, "${userNickname}"😉`
  );
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}
function handleMsgSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_msg", input.value, roomName, () => {
    addMessage(`You : ${value}`);
  });
  input.value = "";
}
function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = nickname.querySelector("input");
  socket.emit("set_nickname", input.value, showServer);
  userNickname = input.value;
  input.value = "";
}
function handleNicknameChg(event) {
  event.preventDefault();
  const input = room.querySelector("#change input");
  userNickname = input.value;
  socket.emit("chg_nickname", input.value, roomName, () => {
    addMessage(`Your nickname changed to ${userNickname}.`);
  });
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
nickForm.addEventListener("submit", handleNicknameSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} joined the room!`);
});

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${left} left the room😥`);
});

socket.on("new_msg", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
