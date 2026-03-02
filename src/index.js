import express from "express";
import {matchRouter} from "./routes/matches.js";
import http from "http";
import {attachWebSocketServer} from "./ws/server.js";


const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';
// Use JSON middleware
app.use(express.json());
const server = http.createServer(app);
app.use('/matches', matchRouter);

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express TypeScript server!' });
});

const {broadcastMatchCreated} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
server.listen(PORT,HOST, () => {
    const baseUrl = HOST ==='0.0.0.0'? `http://localhost:${PORT}`:`http://${HOST}:${PORT}`;
    console.log(`Server is running at ${baseUrl}`);
    console.log(`WebSocket server is running at ${baseUrl.replace('http','ws')}/ws`);
});
