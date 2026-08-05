import express, { type Express, type Request, type Response } from "express";
import "dotenv/config";
import userRouter from "./routes/user.route";
import workspaceRouter from "./routes/workspace.route";
import agentRouter from "./routes/agent.route";
import conversationRouter from "./routes/conversation.route";
import messageRouter from "./routes/message.route";
import knowledgeRouter from "./routes/knowledgeBased.route";

const app: Express = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/user", userRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/agent", agentRouter);
app.use("/api/conversation", conversationRouter);
app.use("/api/message", messageRouter);
app.use("/api/knowledgeBased", knowledgeRouter);

export default app;
