import { Router } from "express";
import {
  createDocument,
  createPreSignedUrl,
  deleteDocument,
  getDocuments,
} from "../controller/knowledgeBase.controller";
import { jwtMiddleware } from "../middleware/jwt";

const knowledgeRouter = Router();

knowledgeRouter.post(
  "/create/documents/presigned-url",
  jwtMiddleware,
  createPreSignedUrl,
);

knowledgeRouter.post(
  "/create/document/:knowledgeBaseId",
  jwtMiddleware,
  createDocument,
);

knowledgeRouter.get(
  "/get/document/:knowledgeBaseId",
  jwtMiddleware,
  getDocuments,
);

knowledgeRouter.delete("/delete/:documentId", jwtMiddleware, deleteDocument);

export default knowledgeRouter;
