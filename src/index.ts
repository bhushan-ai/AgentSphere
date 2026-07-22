import express, { type Express, type Request, type Response } from "express";
import "dotenv/config";
const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

export default app;
