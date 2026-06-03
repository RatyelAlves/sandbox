import { io }
from "socket.io-client";

import {
  API_URL,
} from "@/lib/appConfig";

let socket = null;

export function connectSocket(
  token
) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  if (!token) {
    return null;
  }

  socket = io(
    API_URL,
    {
      transports: [
        "websocket",
      ],
      auth: {
        token,
      },
    }
  );

  socket.on(
    "connect",

    () => {
      console.log(
        "SOCKET CONNECTED:",
        socket.id
      );
    }
  );

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
