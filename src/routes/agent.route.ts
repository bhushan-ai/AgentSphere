import { Router } from "express";
import {
  createAgent,
  updateAgent,
  getAgents,
  getAgentsById,
  deleteAgent,
} from "../controller/agent.controller";
import { jwtMiddleware } from "../middleware/jwt";

const agentRouter = Router();

agentRouter.post("/create/:workspaceId", jwtMiddleware, createAgent);
agentRouter.patch("/update/:agentId", jwtMiddleware, updateAgent);
agentRouter.get("/get/:agentId", jwtMiddleware, getAgentsById);
agentRouter.get("/get-all/:workspaceId", jwtMiddleware, getAgents);
agentRouter.delete("/delete/:agentId", jwtMiddleware, deleteAgent);

export default agentRouter;
