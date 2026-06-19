// @ts-nocheck
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken"; // ✅ Pour sécuriser la connexion
import { env } from "./env";

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.socket.corsOrigins,
      methods: ["GET", "POST"],
    },
  });

  // 🛡️ MIDDLEWARE DE SÉCURITÉ : Vérifie le Token avant la connexion
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentification requise pour les WebSockets"));
    }

    try {
      // Vérification du JWT (même secret que votre API)
      const decoded = jwt.verify(token, env.jwt.secret);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Token invalide ou expiré"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).user?.id;
    console.log(
      `🔌 Utilisateur authentifié connecté : ${userId} (Socket: ${socket.id})`,
    );

    /**
     * Un policier rejoint une "salle" (room) spécifique à son commissariat
     * stationId : l'ID du commissariat (ex: 2 pour Karadjé)
     */
    socket.on("join_station", (stationId: string | number) => {
      const roomName = `station_${stationId}`;
      socket.join(roomName);
      console.log(`👮 Policier [${userId}] a rejoint la salle : ${roomName}`);
    });

    /**
     * Quitter une salle (utile si le policier change d'affectation)
     */
    socket.on("leave_station", (stationId: string | number) => {
      socket.leave(`station_${stationId}`);
      console.log(`🏃 Policier a quitté la salle : station_${stationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
    });
  });

  return io;
};
