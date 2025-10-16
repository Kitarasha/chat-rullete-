import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import client from "./src/redisClient.js";
import { handelSocketConnection } from "./src/socketRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';

// нужно для __dirname в ES модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// подключаем статику (фронт из /public)
app.use(express.static(path.join(__dirname, "public")));

// если пользователь просто открыл сайт — отдать index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.PUBLIC_WEBSOCKET_URL || "http://localhost:5173"
  }
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

client.connect()
  .then(() => console.log("database connected"))
  .catch(err => console.log("error connecting db", err));

io.on("connection", (socket) => {
  handelSocketConnection(io, socket);
});

// PORT из .env или 3000 по умолчанию
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log("port running at", PORT));
