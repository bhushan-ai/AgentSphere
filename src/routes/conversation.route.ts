import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
} from "../controller/conversation.controller";
import { jwtMiddleware } from "../middleware/jwt";

const conversationRouter = Router();

conversationRouter.post(
  "/create/:workspaceId",
  jwtMiddleware,
  createConversation,
);
conversationRouter.get(
  "/conversation/:conversationId",
  jwtMiddleware,
  getConversationById,
);
conversationRouter.get(
  "/conversations/:agentId",
  jwtMiddleware,
  getConversations,
);
conversationRouter.delete(
  "/delete/:conversationId",
  jwtMiddleware,
  deleteConversation,
);

export default conversationRouter;
