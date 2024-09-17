const routingCliente=require('./routingCliente');
const routingTienda=require('./routingTienda');

module.exports=function(servExpress){
    servExpress.use('/api/Tienda', routingTienda);
    servExpress.use('/api/Cliente', routingCliente); //<---- en modulo routingCliente estan endpoints zona cliente
                                                    // en este fichero se exporta objeto de express tipo router

}                                                  
