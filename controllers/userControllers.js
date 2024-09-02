import { check, validationResult } from "express-validator";

import Usuario from "../models/Usuario.js";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
  });
};

const formularioRegistro = (req, res) => {
  res.render("auth/registro", {
    pagina: "Crear Cuentas",
  });
};

const registrar = async (req, res) => {
  // console.log(req.body);
  //validacion de cuentas
  await check("nombre").notEmpty().withMessage("nombre obligatorio").run(req);
  await check("email").isEmail().withMessage("eso no es email").run(req);
  await check("password")
    .isLength({ min: 7 })
    .withMessage("almenos 6 caracteres")
    .run(req);
  await check("repetir_password")
    .equals("password")
    .withMessage("los password no son iguales")
    .run(req);

  let resultado = validationResult(req);
  //verificar que el resultado este vacio

  res.json(resultado.array());

  //creando cuentas

  const usuario = await Usuario.create(req.body);
  res.json(usuario);
};

const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso a Bienes Raices",
  });
};

export {
  registrar,
  formularioLogin,
  formularioRegistro,
  formularioOlvidePassword,
};
