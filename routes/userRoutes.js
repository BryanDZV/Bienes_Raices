import express from "express";
import {
  formularioLogin,
  formularioRegistro,
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/login", formularioLogin);
router.get("/registro", formularioRegistro);

export default router;
