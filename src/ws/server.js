import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../aecjet.js";

const matchSubscribers = new Map();
const subscribe = (matchId, socket) => {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId).add(socket);
};
const unsubscribe = (matchId, socket) => {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  subscribers.delete(socket);
  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
};

const cleanupSubscriptions = (socket) => {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
};

const broadcastToMatch = (matchId, payload) => {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

const handleMessage = (socket, data) => {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (e) {
    sendJson(socket, { type: "error", message: "Invalid JSON" });
  }
  if (message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }

  if (message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
  }
};
const sendJson = (socket, payload) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

const broadcastToAll = (wss, payload) => {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
};

export const attachWebSocketServer = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });
  wss.on("connection", async (socket, request) => {
    // Temporarily disable Arcjet for WebSocket connections in development
    // if (wsArcjet) {
    //   try {
    //     const decision = await wsArcjet.protect(request);
    //     if (decision.isDenied()) {
    //       const code = decision.reason.isRateLimit() ? 1013 : 1008;
    //       const reason = decision.reason.isRateLimit()
    //         ? "Rate limit exceeded"
    //         : "Access denied";
    //       socket.close(code, reason);
    //       return;
    //     }
    //   } catch (e) {
    //     console.error("WS connection error", e);
    //     socket.close(1011, "Server security error");
    //     return;
    //   }
    // }
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.subscriptions = new Set();
    sendJson(socket, { type: "welcome" });
    socket.on("message", (message) => {
      handleMessage(socket, message);
    });
    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      socket.terminate();
    });
    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(interval));

  const broadcastMatchCreated = (match) => {
    broadcastToAll(wss, { type: "match_create", data: match });
  };

  const broadcastCommentary = (matchId, comment) => {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  };
  return { broadcastMatchCreated, broadcastCommentary };
};
