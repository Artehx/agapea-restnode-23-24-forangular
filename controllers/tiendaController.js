const axios=require('axios');

//para inicializar firebase:  https://firebase.google.com/docs/web/setup?authuser=0&hl=es#add-sdks-initialize
const {initializeApp}=require('firebase/app');
//OJO!! nombre variable donde se almacena la cuenta de acceso servicio firebase: FIREBASE_CONFIG (no admite cualquier nombre)
//no meter el json aqui en fichero de codigo fuente como dice la doc...
const app=initializeApp(JSON.parse(process.env.FIREBASE_CONFIG)); 

//------------ CONFIGURACION ACCESO:  FIREBASE-AUTHENTICATION -------------
const  {getAuth }=require('firebase/auth');

const auth=getAuth(app); //<--- servicio de acceso a firebase-authentication

//------------ CONFIGURACION ACCESO:  FIREBASE-DATABASE -------------------
const {getFirestore, getDocs, collection, where, query, addDoc, getDoc, orderBy, startAt}=require('firebase/firestore');

const db=getFirestore(app); //<---- servicio de acceso a todas las colecciones de la BD definida en firebase-database




module.exports={
    recuperarProvincias: async (req,res,next)=>{
        try {

            let _resp=await axios.get(`https://apiv1.geoapi.es/provincias?type=JSON&key=${process.env.GEOAPI_KEY}&sandbox=0`);
            let _provs=_resp.data.data;
            //console.log('provincias recuperadas...', _provs);            

            /* ----- con coleccion provincias firebase....
            let _snapProvs=await getDocs(collection(db,'provincias'),orderBy('PRO'));            
            
            let _provs=[];
            _snapProvs.forEach( snapProv=> _provs.push(snapProv.data()));
            */

            res.status(200).send(_provs);

        } catch (error) {
            console.log('error al recuperar provincias...',error);
            res.status(200).send([]);        
        }
    },
    recuperarMunicipios: async (req,res,next)=>{
        try {
            let _codpro=req.query.codpro;

            let _resp=await axios.get(`https://apiv1.geoapi.es/municipios?CPRO=${_codpro}&type=JSON&key=${process.env.GEOAPI_KEY}&sandbox=0`);
            let _munis=_resp.data.data;
            //console.log(`municipios de provincia ${_codpro}...`, _munis);

            /* ---------- desde firebase en coleccion municipios ....
            let _snapMunis=await getDocs(collection(db,'municipios'),where('CPRO','==',_codpro),orderBy('DMUN50'));
            
            let _munis=[];
            _snapMunis.forEach( snapMuni=>_munis.push(snapMuni.data()));

            console.log('municipios recuperados...', _munis);
            */
           
            res.status(200).send(_munis)

        } catch (error) {
            console.log('error al recuperar municipios...',error);
            res.status(200).send([]);
        }
    },
    recuperarLibros: async (req,res,next)=>{
        try {
            let _idcat=req.query.idcat;
            console.log('recuperando libros de categoria...', _idcat);
            //firebase NO PUEDE BUSCAR POR PATRONES dentro de un campo de texto, como cualquier otra bd...solucion? o bajas toda la coleccion de libros y buscas del lado del cliente
            //o buscas api externas de busqueda de texto: https://firebase.google.com/docs/firestore/solutions/search?provider=algolia
            //muy usadas como algolia,elastic,...
            let _snapshotibros=await getDocs(query(collection(db,'libros'),orderBy('IdCategoria'),startAt(_idcat)));
            let _libros=[];
            _snapshotibros.forEach( snaplibro=> _libros.push(snaplibro.data()));

            res.status(200).send(_libros);
                
        } catch (error) {
            console.log('error al recuperar libros...',error);
            res.status(200).send([]);

        }        
    },
    recuperarUnLibro: async (req,res,next)=>{
        try {
            let _isbn=req.query.isbn;
            console.log('recuperando libro con isbn...', _isbn);
    
            let _librosnaps=await getDocs( query(collection(db,'libros'),where('ISBN13','==',_isbn)) );
            let _libro={};
            _librosnaps.forEach( librosnap=> _libro=librosnap.data());
    
            res.status(200).send(_libro);    

        } catch (error) {
            console.log('error al recuperar libro por isbn...',error);
            res.status(200).send(undefined);
        }
    },
    recuperarCategorias: async (req,res,next)=>{
        try {
            let _idcat=req.query.idcat;
            let _regex;
            if(_idcat=="raices") {
                _regex=new RegExp("^[0-9]{1,}$");
            } else {
                _regex=new RegExp("^" + _idcat + "-[0,9]{1,}$")
            }
            let _catSnaps=await getDocs(collection(db,'categorias'));
            
            let _cats=[];
            _catSnaps.forEach( catdoc => _cats.push(catdoc.data()));

            res.status(200).send(_cats.filter( cat=> _regex.test(cat.IdCategoria) ).sort( (a,b)=>parseInt(a.IdCategoria) < parseInt(b.IdCategoria) ? -1 : 1 ));

        } catch (error) {
            console.log('error recuperar categorias...',error);
            res.status(200).send([]);
        }
    },
    finalizarPedido: async (req,res,next)=>{
        try {
            let {pedido,email}=req.body;
            console.log('datos finalizar pedido...',{email,pedido});

        } catch (error) {
            console.log('error finalizar pedido...', error);
        }
    },
}