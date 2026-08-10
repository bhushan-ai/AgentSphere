import { Router } from "express";
import {
  createUser,
  login,
  logout,
  updateUser,
} from "../controller/user.controller";
import { jwtMiddleware } from "../middleware/jwt";

const userRouter = Router();

//public Routes
userRouter.post("/register", createUser);
userRouter.post("/login", login);
userRouter.delete("/logout", logout);

//protected Routes
userRouter.patch("/update", jwtMiddleware, updateUser);

export default userRouter;
