import { check, validationResult } from "express-validator";
import { generarId } from "../helpers/tokens.js";
import { emailRegistro } from "../helpers/emails.js";
import Usuario from "../models/Usuario.js";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
  });
};

const formularioRegistro = (req, res) => {
  res.render("auth/registro", {
    pagina: "Crear Cuentas",
    csrfToken: req.csrfToken()
  });
};

const registrar = async (req, res) => {
  // console.log(req.body);

  //validacion de cuentas
  await check("nombre")
    .notEmpty()
    .withMessage("El Nombre no puede ir vacio")
    .run(req);
  await check("email").isEmail().withMessage("Eso no parece un email").run(req);
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El Password debe ser de al menos 6 caracteres")
    .run(req);
  await check("repetir_password")
    .equals(req.body.password)
    .withMessage("Los Passwords no son iguales")
    .run(req);

  let resultado = validationResult(req);
  // res.json(resultado.array());

  //verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Hay errores en la validacion
    return res.render("auth/registro", {
      pagina: "Crear Cuentas",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }

  //destructuring de datos
  const { nombre, email, password } = req.body;


  //verificar que el usuario no este duplicado
  const existeUsuario = await Usuario.findOne({
    where: { email },
  });
  if (existeUsuario) {
    return res.render("auth/registro", {
      pagina: "Crear Cuentas",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Ya existe el Usuario" }],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }
  //Almacenar un usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId(),
  });

  //Envia email de confirmacion
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });

  //Mostrar Mensaje de Confirmación
  res.render("templates/mensaje", {
    pagina: "Cuenta creada correctamente",
    mensaje: "Hemos enviado un mensaje a tu email para la confirmacion",
  });
};

//Funcion que comprueba una cuenta

const confirmar = async (req, res) => {
  const { token } = req.params;
   //console.log(token, "holaaaa");


  //Verificar si el token es válido

  const usuario = await Usuario.findOne({ where: { token } });
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "error al confirmar tu cuenta",
      mensaje: "Hubo un error al confirmar tu cuenta, intenta denuevo",
      error: true,
    });
  }


  //Confirmar la cuenta

  usuario.token=null;
  usuario.confirmado=true;
  await usuario.save();


  res.render("auth/confirmar-cuenta", {
    pagina: "cuenta confirmada",
    mensaje: "La cuenta se confirmó Correctamente"
  });


  

  
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
  confirmar,
  formularioOlvidePassword,
};

//creando cuentas
// try {
//   // Creación de cuentas
//   const usuario = await Usuario.create(req.body);
//   console.log("Usuario creado:", usuario); // Verifica el objeto usuario
//   res.json(usuario); // Envía el usuario creado en formato JSON
// } catch (error) {
//   console.error("Error al crear usuario:", error);
//   res.status(500).json({ error: "Error al crear usuario" });
// }console.log(existeUsuario);
