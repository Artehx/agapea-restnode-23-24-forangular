//modulo de codigo nodejs q exporta una funcion q recibe como parametro la instancia del servidor express
//creado en el modulo principal y sobre el mismo configuramos los middleware de la pipeline del server
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser');
const cors=require('cors');

const configrouting=require('./config_routing_middleware');


module.exports=function(servExp){
    //------ configuracion de la pipeline del servidor express------------
    //middleware de terceros:
    // - cookie-parser: extrae de la pet.del cliente http-request, la cabecera Cookie, extrae su valor y lo mete en una prop.del objeto req.cookie
    // - body-parser: extrae de la pet.del cliente http-rerquest, del body los datos mandados en formato x-www-form-urlenconded o json extrae su valor y los mete en una prop.del objeto req.body
    // - cors: para evitar errores cross-origin-resouce-sharing
    servExp.use( cookieParser() );
    servExp.use( bodyParser.json() );
    servExp.use( bodyParser.urlencoded( { extended:true } ) ); 
    servExp.use(cors());

    /*middleware propios:
    - enrutamiento <---- rutas o endpoints del servicio REST(FULL) montado en el servidor express, siempre devuelven datos formato JSON
                        el foramto de estas rutas:   /api/....    
     definido mediante modulo de codigo:  config_routing_middleware <---- exporta una funcion q recibe como
     parametro el serv.express en el cual quiero configurar los endpoints del enrutamiento     
    */
    configrouting(servExp);
}