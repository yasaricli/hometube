import { io } from "socket.io-client";

let socket;

// one socket.io connection, opened on first use
export const getSocket = () => {
  socket ||= io();
  return socket;
};
