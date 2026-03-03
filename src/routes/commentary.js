import { Router } from "express";
import { matchIdParamsSchema } from "../validation/matches.js";
import {createCommentarySchema, listCommentaryQuerySchema} from "../validation/commentary.js";
import { commentary } from "../db/schema.js";
import { db } from "../db/config.js";
import {desc, eq} from "drizzle-orm";
const MAX_LIMIT = 100;
export const commentaryRouter = Router();

commentaryRouter.get("/:id/commentary", async(req, res) => {
  const paramsResult = matchIdParamsSchema.safeParse(req.params)
  if(!paramsResult.success){
    return res.status(400).json({ error: "Invalid match ID", details: paramsResult.error.issues });
  }
  const queryResult = listCommentaryQuerySchema.safeParse(req.query);
  if(!queryResult.success){
    return res.status(400).json({ error: "Invalid query parameters", details: queryResult.error.issues });
  }
  try{
    const { id:matchId } = paramsResult.data;
    const { limit = 10 } = queryResult.data;
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(safeLimit);
    return res.status(200).json({ data: results });
  }catch(error){
    console.error("Failed to list commentary", error);
    res
      .status(500)
      .json({ error: "Failed to list commentary", details: error.message });
  }
});

commentaryRouter.post("/:id/commentary", async (req, res) => {
  const paramsResult = matchIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid match ID", details: paramsResult.error.issues });
  }
  const bodyResult = createCommentarySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({
      error: "Invalid commentary payload",
      details: bodyResult.error.issues,
    });
  }

  try {
    const { minute, ...rest } = bodyResult.data;
    console.log("Minute:", minute);
    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramsResult.data.id, 
        minute,
        ...rest,
      })
      .returning();
    if(res.app.locals.broadcastCommentary){
      res.app.locals.broadcastCommentary(result.matchId,result);
    }
    return res.status(201).json({ data: result });
  } catch (error) {
    console.error("Failed to create commentary", error);
    res
      .status(500)
      .json({ error: "Failed to create commentary", details: error.message });
  }
});
