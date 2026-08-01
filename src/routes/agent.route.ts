import { Router } from "express";
import { createAgent } from "../controller/agent.controller";
import { jwtMiddleware } from "../middleware/jwt";

const agentRouter = Router();

agentRouter.post("/create/:workspaceId", jwtMiddleware, createAgent);

export default agentRouter;
