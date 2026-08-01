import express, { type Express, type Request, type Response } from "express";
import "dotenv/config";
import userRouter from "./routes/user.route";
import workspaceRouter from "./routes/workspace.route";
import agentRouter from "./routes/agent.route";
const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/user", userRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/agent", agentRouter);

export default app;
