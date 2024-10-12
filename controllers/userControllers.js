import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { generarJWT,generarId } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
import Usuario from "../models/Usuario.js";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
    csrfToken:req.csrfToken(),
  });
};

const autenticar= async(req,res)=>{
  //console.log('autenticando...');

  //validacion
  await check("email").isEmail().withMessage("El email es obligatorio").run(req);
  await check("password")
    .notEmpty()
    .withMessage("El Password es obligatorio")
    .run(req);
  
    let resultado = validationResult(req);
    // res.json(resultado.array());
  
    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
      //Hay errores en la validacion
      return res.render("auth/login", {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(),
        errores: resultado.array(),
        
      });
    }

    const{email,password}=req.body

    //comprobar si el usuario existe

    const usuario= await Usuario.findOne({where:{email}})
    if (!usuario) {
      return res.render("auth/login", {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(),
        errores: [{msg:'El usuario no existe'}]
        
      })
      
    }

    //comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
      return res.render("auth/login", {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(),
        errores: [{msg:'Tu cuenta no ha sido confirmada'}]
        
      })
      
    }

    //Revisar el Password

    if (!usuario.verificarPassword(password)) {

      return res.render("auth/login", {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken(),
        errores: [{msg:'El password es incorrecto'}]
        
      })
    }

    // Autenticar al usuario

    const token = generarJWT({id:usuario.id, nombre:usuario.nombre})

    console.log(token);
    
    //Almacenar en un cookie

    return res.cookie('_token',token,{
    httpOnly:true,
    //secure:true, solo enpaginas seguras deployment time si me deja lo aactivo
    //sameSite:true,solo enpaginas seguras deployment time si me deja lo aactivo
  }).redirect('/mis-propiedades')


}

const formularioRegistro = (req, res) => {
  res.render("auth/registro", {
    pagina: "Crear Cuentas",
    csrfToken: req.csrfToken(),
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

  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "cuenta confirmada",
    mensaje: "La cuenta se confirmó Correctamente",
  });
};

const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso a Bienes Raices",
    csrfToken: req.csrfToken(),
  });
};

const resetPassword = async (req, res) => {
  // console.log(req.body);

  //validacion de cuenta solo email

  await check("email").isEmail().withMessage("Eso no parece un email").run(req);

  let resultado = validationResult(req);
  // res.json(resultado.array());

  //verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Hay errores en la validacion
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  //BUSCAR AL USUARIO

  const { email } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });
  //console.log(usuario);
  if (!usuario) {
    //
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El email no pertenece a ningun usuario" }],
    });
  }

  //Generar Token y enviar el email

  usuario.token = generarId();
  await usuario.save();

  //Enviar Email

  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  });

  //Renderizar un mensaje

  res.render("templates/mensaje", {
    pagina: "Reestablece tu Password",
    mensaje: "Hemos enviado un email con las instrucciones",
  });
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({ where: { token } });
  //console.log(usuario);

  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Reestrable tu password",
      mensaje: "Hubo un error al validar tu informacion, intenta de nuevo",
      error: true,
    });
  }

  //Mostrar formular para modificar el password

  res.render("auth/reset-password", {
    pagina: "Reestable tu Password ",
    csrfToken: req.csrfToken(),
  });
};

const nuevoPassword = async (req, res) => {
  //console.log('guardando Password...');

  //validar el password
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El password debe ser al menos 6 caracteres")
    .run(req);

  let resultado = validationResult(req);
  // res.json(resultado.array());

  //verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    //Hay errores en la validacion
    return res.render("auth/reset-password", {
      pagina: "Reestable tu password",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  const { token } = req.params;
  const { password } = req.body;

  //identificar quie hace el cambio

  const usuario = await Usuario.findOne({ where: { token } });
  //console.log(usuario);

  //hashear el nuevo password
  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;

  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "Password Reestablecido",

    mensaje: "El Password se guardó correctamente",
  });
};

export {
  registrar,
  formularioLogin,
  autenticar,
  formularioRegistro,
  confirmar,
  formularioOlvidePassword,
  resetPassword,
  comprobarToken,
  nuevoPassword,
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
