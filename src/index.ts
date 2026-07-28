import express, { type Express, type Request, type Response } from "express";
import "dotenv/config";
import userRouter from "./routes/user.route";
const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/user", userRouter);

export default app;
