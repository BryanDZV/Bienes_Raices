import nodemailer from "nodemailer";

const emailRegistro = async (datos) => {
  //obtenido de mailtrap servicio de pruebas de email
  var transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  //Enviar el email
  await transport.sendMail({
    from: "BienesRaices.com",
    to: email,
    subject: "Confirma tu cuenta en BienesRaices.com",
    text: "HOL MUNDO confirma tu cuenta",
    html: `
    <p>Hola ${nombre}, comprueba tu cuenta en BienesRaices.com</p>
    
    <p>confirma tu cuenta en el enlace: <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3001
    }/auth/confirmar/${token}">confrima tu cuenta</a></p>

    <p>si tu no creaste esta cuenta puedes ignorar este mensaje</p>
    
    `,
  });
};

export { emailRegistro };
