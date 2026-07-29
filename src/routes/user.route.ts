import { Router } from "express";
import { createUser, login, logout } from "../controller/user.controller";

const userRouter = Router();

userRouter.post("/register", createUser);
userRouter.post("/login", login);
userRouter.get("/logout", logout);

export default userRouter;
