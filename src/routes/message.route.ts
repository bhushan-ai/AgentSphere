import { Router } from "express";
import { deleteMessage, getMessages, sendMessage } from "../controller/message.controller";
import { jwtMiddleware } from "../middleware/jwt";

const messageRouter = Router();

messageRouter.post(
  "/conversation/:conversationId/message",
  jwtMiddleware,
  sendMessage,
);
messageRouter.get(
  "/conversation/:conversationId/message",
  jwtMiddleware,
  getMessages,
);
messageRouter.delete(
  "/conversation/delete/:messageId",
  jwtMiddleware,
  deleteMessage,
);


export default messageRouter;
