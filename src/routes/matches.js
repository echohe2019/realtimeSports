import {Router} from "express";
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {db} from "../db/config.js";
import {matches} from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";

export const matchRouter = Router();
const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if(!parsed.success){
        return res.status(404).json({error:'Invalid query',details:JSON.stringify(parsed.error)})
    }
    const limit = Math.min(parsed.data.limit || 50, MAX_LIMIT);
    try{
        const data = await db.select().from(matches).orderBy(
                matches.id,
        ).limit(limit);
        return res.status(200).json({data})
    }catch(e){
        res.status(400).json({error:'Invalid query',details:JSON.stringify(parsed.error)})
    }
})
matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body)
    
    if(!parsed.success){
        return res.status(404).json({error:'Invalid payload',details:JSON.stringify(parsed.error)})
    }
    
    const {startTime,endTime,homeScore,awayScore, sport} = parsed.data;
    
    try{
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const {  homeTeam, awayTeam } = parsed.data;
        
        const [event] = await db.insert(matches).values({
            sport,
            homeTeam,
            awayTeam,
            startTime: startDate,
            endTime: endDate,
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startDate, endDate) || 'scheduled',
        }).returning();
        res.status(201).json({data: event});
    }catch(error){
        return res.status(500).json({error:'Failed to create match', details: JSON.stringify(error)});
    }
})