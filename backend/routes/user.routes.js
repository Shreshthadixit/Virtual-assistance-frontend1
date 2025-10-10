import express from "express";
import { getCurrentUser, updateAssistant, askToAssistant } from "../controllers/user.controller.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/current", isAuth, getCurrentUser);
router.post("/asktoassistant", isAuth, askToAssistant);
router.put("/update-assistant", isAuth, updateAssistant);

export default router;
