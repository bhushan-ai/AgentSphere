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
userRouter.get("/logout", logout);

//protected Routes
userRouter.put("/update", jwtMiddleware, updateUser);

export default userRouter;
