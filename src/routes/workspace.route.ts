import { Router } from "express";
import { createWorkspace, getWorkspace, inviteUserToWorkspace } from "../controller/workspace.controller";
import { jwtMiddleware } from "../middleware/jwt";

const workspaceRouter = Router();

workspaceRouter.post("/create", jwtMiddleware, createWorkspace);
workspaceRouter.get("/get", jwtMiddleware, getWorkspace);
workspaceRouter.post("/invite/:workspaceId", jwtMiddleware, inviteUserToWorkspace);


export default workspaceRouter;
