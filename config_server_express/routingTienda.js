const express=require('express');

const router=express.Router(); //<----- objeto router a exportar...

const tiendaController=require('../controllers/tiendaController');


//añado endpoints y funciones middleware a ese objeto router importardas desde un objeto javascript q funciona como si fuese un "controlador":
router.get('/RecuperarLibros', tiendaController.recuperarLibros); //<---- en url, hay variable: ?email=....
router.get('/RecuperarUnLibro', tiendaController.recuperarUnLibro);
router.get('/RecuperarCategorias', tiendaController.recuperarCategorias);
router.get('/RecuperarProvincias', tiendaController.recuperarProvincias);
router.get('/RecuperarMunicipios', tiendaController.recuperarMunicipios);
router.post('/FinalizarPedido', tiendaController.finalizarPedido);



module.exports=router;