//------------------- modulo principal de entrada app. nodejs config express  ------------------------
// - definimos instancia de express
require('dotenv').config(); //<---- paquete para definir como variables de entorno en fichero .env valores criticos, y recuperarlos con: process.env.nombre_variable
const express=require('express'); //<---en la variable express se almacena la funcion q genera el servidor web, exportada por el modulo 'express'
var serverExpress=express();

const configServer=require('./config_server_express/config_pipeline'); 

//-----------------------------------------
serverExpress.listen(3000, ()=>console.log('...servidor web express escuchando por puerto 3000...') );
configServer(serverExpress);

