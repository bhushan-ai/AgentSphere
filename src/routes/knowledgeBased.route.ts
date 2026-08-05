import { Router } from "express";
import { createPreSignedUrl } from "../controller/knowledgeBase.controller";
import { jwtMiddleware } from "../middleware/jwt";

const knowledgeRouter = Router();

knowledgeRouter.post(
  "/create/documents/presigned-url",
  jwtMiddleware,
  createPreSignedUrl,
);

export default knowledgeRouter;
