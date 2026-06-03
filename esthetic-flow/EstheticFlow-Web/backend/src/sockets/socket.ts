import { Server }
from "socket.io";

import {
  verifyAccessToken,
} from "../services/auth/auth.service";

let io: Server;

export function initializeSocket(
  server: unknown
) {

  io = new Server(
    server as Parameters<
      typeof Server
    >[0],
    {
      cors: {
        origin: true,
      },
    }
  );

  io.use(
    (socket, next) => {
      try {
        const token =
          socket.handshake.auth
            ?.token;

        if (
          typeof token !==
          "string"
        ) {
          return next(
            new Error(
              "Não autenticado"
            )
          );
        }

        const payload =
          verifyAccessToken(
            token
          );

        socket.data.userId =
          payload.userId;

        next();
      } catch {
        next(
          new Error(
            "Token inválido"
          )
        );
      }
    }
  );

  io.on(
    "connection",

    (socket) => {

      console.log(
        "SOCKET CONNECTED:",
        socket.id,
        socket.data.userId
      );

      socket.on(
        "disconnect",

        () => {

          console.log(
            "SOCKET DISCONNECTED:",
            socket.id
          );
        }
      );
    }
  );
}

export {
  io,
};
