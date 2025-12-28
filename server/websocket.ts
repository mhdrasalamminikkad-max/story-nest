import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Map<string, Set<WebSocket>>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket client connected");

      ws.on("message", (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("close", () => {
        // Remove client from all user lists
        for (const userClients of this.clients.values()) {
          userClients.delete(ws);
        }
        console.log("WebSocket client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    if (message.type === "subscribe") {
      const userId = message.data?.userId;
      if (userId) {
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId)!.add(ws);
      }
    }
  }

  public broadcast(event: string, data: any) {
    const message = JSON.stringify({ type: event, data });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public sendToUser(userId: string, event: string, data: any) {
    const message = JSON.stringify({ type: event, data });
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  public sendToAdmin(event: string, data: any) {
    // Broadcast to all connected clients (admin panel listeners)
    this.broadcast(event, data);
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: Server) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}
