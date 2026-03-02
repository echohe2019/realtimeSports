import express from "express";
import {matchRouter} from "./routes/matches.js";


const app = express();
const PORT = 8000;

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express TypeScript server!' });
});
app.use('/matches', matchRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// {
//     "sport":"football",
//     "homeTeam":"Manchester City",
//     "awayTeam":"JSM United",
//     "startTime":"2026-03-03T12:00:00.000Z",
//     "endTime":"2026-03-03T13:45:00.000Z"
// }