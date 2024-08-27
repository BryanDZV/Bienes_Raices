//importar rutas y denas
// const express = require("express"); Common JS modo antiguo
import express from "express"; // type:module
import userRoutes from "./routes/userRoutes.js";

//crear la app

const app = express(); //se le conoce como Common JS

//Habilitar pug
app.set("view engine", "pug");
app.set("views", "./views");

//Carpeta publica
app.use(express.static("public"));

//Routing
//(get solo ruta exacta use busca todas las que inicien con /o lo que pongas y te da)
// app.use("/", userRoutes);

app.use("/auth", userRoutes);

//Defenir un puerto y arrancar el proyecto

const port = 3001;
app.listen(port, () => {
  console.log(
    `El servidor se esta escuchando en el puerto http://localhost:${port}`
  );
});
