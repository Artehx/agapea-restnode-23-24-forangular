//para inicializar firebase:  https://firebase.google.com/docs/web/setup?authuser=0&hl=es#add-sdks-initialize
const {initializeApp}=require('firebase/app');
//OJO!! nombre variable donde se almacena la cuenta de acceso servicio firebase: FIREBASE_CONFIG (no admite cualquier nombre)
//no meter el json aqui en fichero de codigo fuente como dice la doc...
const app=initializeApp(JSON.parse(process.env.FIREBASE_CONFIG)); 

//------------ CONFIGURACION ACCESO:.  FIREBASE-AUTHENTICATION -------------
const {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, checkActionCode, applyActionCode}=require('firebase/auth');

const auth=getAuth(app); //<--- servicio de acceso a firebase-authentication

//------------ CONFIGURACION ACCESO:  FIREBASE-DATABASE -------------------
const {getFirestore, getDocs, doc, collection, where, query, addDoc, getDoc,updateDoc,arrayRemove,arrayUnion}=require('firebase/firestore');

const db=getFirestore(app); //<---- servicio de acceso a todas las colecciones de la BD definida en firebase-database

//------------ CONFIGURACION ACCESO: FIRBASE-STORAGE ----------------------
const { getStorage, ref, uploadString, list }=require('firebase/storage');

const storage=getStorage(app); //<---------- servicio de acceso al almacenamiento de ficheros en el storage de firebase...





function generaRespuesta(codigo,mensaje,errores,token,datoscliente,otrosdatos,res){
    //if(req.body.refreshtoken) token=req.body.refreshtoken;
    res.status(200).send( { codigo,mensaje, errores,token,datoscliente,otrosdatos });

}

function getListById(clientEmail, idList) {

    try {

     

        
    } catch (error) {
        
    }

}

module.exports={
    login: async (req, res, next)=>{
        try {
            console.log('datos mandados por servicio de angular...', req.body); //{email: ..., password: ....}
        
            //1º inicio de sesion en FIREBASE con email y password:
            // https://firebase.google.com/docs/auth/web/password-auth?authuser=0&hl=es#sign_in_a_user_with_an_email_address_and_password
            let _userCredential=await signInWithEmailAndPassword(auth, req.body.email, req.body.password);
            //console.log('resultado del login en firebase ....', _userCredential);

            //2º recuperar de la bd de firebase-firestore de la coleccion clientes los datos del cliente asociados al email de la cuenta
            //y almacenar el JWT q firebase a originado por nosotros 
            //https://firebase.google.com/docs/firestore/query-data/get-data?hl=es&authuser=0#get_multiple_documents_from_a_collection
            let _clienteSnapShot=await getDocs( query(collection(db,'clientes'),where('cuenta.email','==',req.body.email)) );
            //console.log('snapshot recuperado de clientes...', _clienteSnapShot);
                
            let _datoscliente=_clienteSnapShot.docs.shift().data();
            console.log('datos del clietne recuperados...', _datoscliente);

            res.status(200).send(
                {
                    codigo: 0,
                    mensaje: 'login oks...',
                    errores: null,
                    datoscliente: _datoscliente,
                    token: await _userCredential.user.getIdToken(),
                    otrosdatos: null
                }
            );

        } catch (error) {
            console.log('error en el login....', error);
            res.status(200).send(
                                    {
                                        codigo: 1,
                                        mensaje:'login fallido',
                                        error: error.message,
                                        datoscliente:null,
                                        token:null,
                                        otrosdatos:null
                                    }
                                );
        }
    },
    registro: async (req,res,next)=>{ 
        try {
            console.log('datos recibidos por el servicio de angular desde comp.registro...', req.body);
            let { cuenta, ...restocliente }=req.body;

            //1º creacion de una cuenta FIREBASE dentro de Authentication basada en email y contraseña:
            //https://firebase.google.com/docs/auth/web/password-auth?authuser=0&hl=es#create_a_password-based_account
            let _userCredential=await createUserWithEmailAndPassword(auth, cuenta.email, cuenta.password);
            console.log('resultado creacion creds. usuario  recien registrado....', _userCredential);

            //2º mandamos email de activacion de cuenta:
            await sendEmailVerification(_userCredential.user);

            //3º almacenamos los datos del cliente (nombre, apellidos, ...) en coleccion clientes de firebase-database
            //https://firebase.google.com/docs/firestore/manage-data/add-data?hl=es&authuser=0#add_a_document
            let _clienteRef=await addDoc(collection(db,'clientes'),req.body);
            console.log('ref.al documento insertado en coleccion clientes de firebase...', _clienteRef);


            res.status(200).send(
                {
                    codigo: 0,
                    mensaje: 'registro oks...',
                    errores: null,
                    datoscliente: _userCredential.user,
                    token: await _userCredential.user.getIdToken(),
                    otrosdatos: null                    
                }
            );
        } catch (error) {
            console.log('error en el registro....', error);
            res.status(200).send(
                                    {
                                        codigo: 1,
                                        mensaje:'registro fallido',
                                        error: error.message,
                                        datoscliente:null,
                                        token:null,
                                        otrosdatos:null
                                    }
                                );           
        }
    },
    comprobarEmail: async (req,res,next)=>{
        try {
            let _email=req.query.email;
            console.log('email en parametro...', _email);

            let _resulSnap=await getDocs(query(collection(db,'clientes'),where('cuenta.email','==', _email)));
            let _datoscliente=_resulSnap.docs.shift().data();
            
            console.log('datos del clietne recuperados con ese email....', _datoscliente);
            if(_datoscliente){
                res.status(200).send(
                    {
                        codigo: 0,
                        mensaje:'email existe',
                        error: null,
                        datoscliente:_datoscliente,
                        token:null,
                        otrosdatos:null
                    }
                );            

            } else {
                throw new Error('no existe cliente con ese email, email no registrado');
            }
        } catch (error) {
            console.log('error en el comprobacion email....', error);
            res.status(200).send(
                                    {
                                        codigo: 1,
                                        mensaje:'comprobacion email fallida',
                                        error: error.message,
                                        datoscliente:null,
                                        token:null,
                                        otrosdatos:null
                                    }
                                );            
        }

    },
    activarCuenta: async  (req,res,next)=>{
        try {
            let { mod,cod,key}=req.query;
            //1º comprobar si el token de activacion de la cuenta es para verificar-email o no 
            // lo ideal tb seria comprobar q el token enviado pertenece al usuario q quiere activar la cuenta (su email)
            let _actionCodeInfo=await checkActionCode(auth,cod); //<---objeto clase ActionCodeInfo
            console.log('actioncodeinfo en activar cuenta usuario firebase....', _actionCodeInfo);
    
            if(_actionCodeInfo.operation=='VERIFY_EMAIL'){
                //en _actionCodeInfo.data <--- email, comprobar si exite en clientes...
                await applyActionCode(auth,cod);
                res.status(200).send(
                    {
                        codigo: 0,
                        mensaje:'activacion cuenta oks',
                        error: null,
                        datoscliente:null,
                        token:null,
                        otrosdatos:null
                    }
                );                   

            }else {
                throw new Error('token no valido para verificar EMAIL...');
            }
                
        } catch (error) {
            console.log('error en activacion cuenta usuario....', error);
            res.status(200).send(
                                    {
                                        codigo: 1,
                                        mensaje:'activacion cuenta fallida',
                                        error: error.message,
                                        datoscliente:null,
                                        token:null,
                                        otrosdatos:null
                                    }
                                );             
        }

    },
    operarDireccion: async (req,res,next)=>{
        console.log(req.body); //{ direccion:..., operacion: ..., email: ...}
        try {
            //recupero de la coleccion clientes el documento con ese email, lanzo query:
        let _refcliente=(await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.email)))).docs[0];
        console.log('cliente recuperado de firebase-database...', _refcliente.data());

        switch (req.body.operacion) {
            case 'borrar':
                //tengo elimiinar del array de direcciones del objeto cliente recuperado la direccion q nos pasan: arrayRemove
                await updateDoc(_refcliente.ref,{'direcciones': arrayRemove(req.body.direccion)});                
                break;

            case 'crear':
                //tengo q añadir al array de direcciones del objeto cliente recuperado la nueva direccion:  arrayUnion
                await updateDoc(_refcliente.ref,{'direcciones': arrayUnion(req.body.direccion)});
                break;

            case 'fin-modificacion':
                //dos posibilidades: accedes a direccion, la recuperas y vas modificandop prop.por prop o eliminas y añades
                let _direcciones=_refcliente.data().direcciones;
                let _posmodif=_direcciones.findIndex( direc=>direc.idDireccion==req.body.direccion.idDireccion);
                _direcciones[_posmodif]=req.body.direccion;

                await updateDoc(_refcliente.ref, {'direcciones': _direcciones });
                break;
        }

        //OJO!!! si usas la ref.al documento cliente de arriba, es un snapshot...no esta actualizada!!!! a las nuevas
        //direcciones, tienes q volver a hacer query...esto no vale:
        //let _clienteActualizado=(await getDoc(doc(db,'clientes',_refcliente.id))).data();
        let _clienteActualizado=(await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.email)))).docs[0].data();

        console.log('cliente actualizado mandado en el restmessage....',_clienteActualizado);

        generaRespuesta(0,`${req.body.operacion} sobre direccion realizada OK!!`,null,'',_clienteActualizado,'',res);

        } catch (error) {
            console.log('error en operar direcciones...', error);
            generaRespuesta(6,`fallo a la hora de ${req.body.operacion} sobre direccion ${req.body.direccion.calle} al guardar en bd...`,error,null,null,null,res);
        }
    },

    saveList: async(req, res, next) => {
     
        try {
            
        console.log('La lista a crear es -> ', req.body)

        const clientesRef = collection(db, 'clientes');
        const clientesQuery = query(clientesRef, where('cuenta.email', '==', req.body.list.emailClient));

        const clientesSnapshot = await getDocs(clientesQuery);
        
        const clienteRef = clientesSnapshot.docs[0].ref;
        const clienteData = clientesSnapshot.docs[0].data();
        const listasActuales = clienteData.lists || [];
        
        console.log('Listas en la bd -> ', listasActuales);

        const newList = req.body.list;

    
        if (req.body.bookId) {
            console.log('Buscando libro por ISBN13...');

            const librosRef = collection(db, 'libros');
            const libroQuery = query(librosRef, where('ISBN13', '==', req.body.bookId));
            const libroSnapshot = await getDocs(libroQuery);

            if (libroSnapshot.empty) {
                console.log('El libro no se encuentra en la base de datos.');
                return res.status(404).json({ message: 'Libro no encontrado' });
            }

            const libroData = libroSnapshot.docs[0].data();

            console.log('Info del libro: ', libroData);

            if (libroData) {
                // Añadir el libro a la lista
                newList.books.push(libroData);
                console.log(`Libro con ISBN13 ${req.body.bookId} agregado a la lista.`);
            } else {
                console.log('El documento del libro está vacío.');
            }
        }

        listasActuales.push(newList);

        console.log('Listas actualizadas para la bd: ', listasActuales);

        await updateDoc(clienteRef, {lists: listasActuales});

        generaRespuesta(0, 'Lista creada!!', null, null, null, listasActuales, res);

        } catch (error) {
            console.log('Error al guardar la lista:', error);
            res.status(500).json({ message: 'Error al guardar la lista', error });
        }


    },

    operateBook: async(req, res, next) => {
     const {isbn13, idList, email} = req.body;

     console.log('OperateBook -> ', req.body);
     console.log('email -> ', email)

     try {

      const clientesRef = collection(db, 'clientes');
      const clientesQuery = query(clientesRef, where('cuenta.email', '==', email));

      const clientesSnapshot = await getDocs(clientesQuery);
        
      const clienteRef = clientesSnapshot.docs[0].ref;
      const clienteData = clientesSnapshot.docs[0].data();

      if(clienteData == null || ""){
        return res.status(404).json({mensaje: 'Cliente no encontrado'})
      }
        
      let lists = clienteData.lists || [];
      let bookOperation = '';

      const listIndex = lists.findIndex(list => list.idList === idList);
      
      if(listIndex === -1){

        return res.status(404).json({mensaje: 'Lista no encontrada'})

      }

      let list = lists[listIndex];
      let bookIndex = list.books.findIndex(book => book.ISBN13 === isbn13);

      if(bookIndex === -1){

        console.log('Llega aqui...')
        //El libro no está en la lista, se agrega
        const booksRef = collection(db, 'libros');
        const bookQuery = query(booksRef, where('ISBN13', '==', isbn13));
        const bookSnapshot = await getDocs(bookQuery);

        if(bookSnapshot.empty){

            console.log('Esta vacio...')
        }

        const bookData = bookSnapshot.docs[0].data();
        list.books.push(bookData);
        bookOperation = 'agregar'
        //console.log('Llega aqui 2...')

      } else {

        // El libro ya está en la lista, se elimina
        list.books.splice(bookIndex, 1);
        bookOperation = 'eliminar'
      }

      //Actualiza la lista en el documento del cliente
      lists[listIndex] = list;
      await updateDoc(clienteRef, {lists: lists})
      
      
      generaRespuesta(0, bookOperation, null, null, null, lists, res);

     } catch (error) {
        console.log('Error al operar con el libro: ', error);
        res.status(500).json({ message: 'Error al operar con el libro', error });
    }
     


    },

    removeList: async(req, res, next) => {

        const {idList, email} = req.body;

        try {

            const clientesRef = collection(db, 'clientes');
            const clientesQuery = query(clientesRef, where('cuenta.email', '==', email));
      
            const clientesSnapshot = await getDocs(clientesQuery);
              
            const clienteRef = clientesSnapshot.docs[0].ref;
            const clienteData = clientesSnapshot.docs[0].data();
      
            if(clienteData == null || ""){
              return res.status(404).json({mensaje: 'Cliente no encontrado'})
            }
              
            let lists = clienteData.lists || [];

            const newLists = lists.filter(list => list.idList !== idList);
            
            if(lists.length === newLists.length){
                return res.status(404).json({mensaje: 'Lista no encontrada'})
            }

            await updateDoc(clienteRef, {lists: newLists});

            generaRespuesta(0, 'Lista borrada!', null, null, null, newLists, res);

        } catch (error) {
            
            console.log('Error al borrar la lista:', error);
            res.status(500).json({ message: 'Error al borrar la lista', error });
        }


    },

    saveComment: async(req, res, next) => {

        console.log('Llega el comentario manin',  req.body);
        //console.log(`Llega el comentario manin  ${(req.body)}`);

        try {

        let _comentarioRef = await addDoc(collection(db, 'comentarios'), req.body.comment);

        console.log('GUARDA EL COMENTARIO... ');

        const comentariosQuery = query(
            collection(db, 'comentarios'),
            where('isbn13', '==', req.body.comment.isbn13)
        );

        const comentariosSnapshot = await getDocs(comentariosQuery);

        if(comentariosSnapshot.empty) {

            console.log('Sin comentarios en este libro')

        }

        const comentarios = comentariosSnapshot.docs.map(doc => doc.data());

        generaRespuesta(0, 'Comentario guardado!', null, null, null, comentarios, res);

            
        } catch (error) {
            
        }

    },

    getAllComments: async(req, res, next) => {

        try {

        const isbn = req.query.isbn;
        console.log('El isbn es -> ', isbn);

        const comentariosRef = collection(db, 'comentarios');
        const comentariosQuery = query(comentariosRef, 
            where('isbn13', '==', isbn),
            where('state', '==', 'Revisado'));
        const comentariosSnapshot = await getDocs(comentariosQuery);

        const comentarios = comentariosSnapshot.docs.map(doc => doc.data());
        console.log('Los comentarios -> ', comentarios);
        res.status(200).send(comentarios);
            
        } catch (error) {
            
        }

    },

    getAllCommentsUser: async(req, res, next) => {

    try {

    const isbn = req.query.isbn;
    const email = req.query.email;

    console.log('el isbn es -> ', isbn);
    console.log('el email es -> ', email);

    const comentariosRef = collection(db, 'comentarios');

    const  userCommentQuery = query(comentariosRef,
        where('isbn13', '==', isbn),
        where('emailClient', '==', email)
    );

    const userCommentSnapshot = await getDocs(userCommentQuery);
    const userComment = userCommentSnapshot.docs.map(doc => doc.data());

    const reviewdCommentsQuery = query(comentariosRef,
          where('isbn13', '==', isbn),
          where('state', '==', 'Revisado')
    );

    const reviewdCommentsSnapshot = await getDocs(reviewdCommentsQuery);
    let reviewdComments = reviewdCommentsSnapshot.docs.map(doc => doc.data());

    if(userComment.length > 0) {
        reviewdComments = reviewdComments.filter(com => com.emailClient !== email)
    }
    
    console.log('Comentarios revisados -> ', reviewdComments)
    console.log('Comentario del usuario -> ', userComment)

    

    res.status(200).send({
       userComment: userComment.length > 0 ? userComment[0] : null,
       reviewdComments: reviewdComments

    })
    

    } catch (error) {
    
      console.log('Error al obtener comentarios del usuario: ', error)
      res.status(500).send({message: 'Error al obtener comentarios'})  
    }



    },

    

    getProfileImage: async(req, res, next) => {

        try {

        const userEmail = req.query.userEmail;

        console.log('El email del usuario es -> ', userEmail);

        const clientesRef = collection(db, 'clientes');

        const clienteQuery = query(clientesRef, where('cuenta.email', '==', userEmail));

        const clienteSnapshot = await getDocs(clienteQuery);

        if(!clienteSnapshot.empty){

            /*
            clienteSnapshot.forEach(doc => {
                console.log('Documento recuperado:', doc.data());
            });*/

            const clienteData = clienteSnapshot.docs[0].data();
            const imagenAvatarBASE64 = clienteData.cuenta.imagenAvatarBASE64;
            const usuario = clienteData.cuenta.login;
            
            console.log("El usuario es -> ", usuario);
            res.status(200).send({imagenAvatarBASE64, usuario});
        } else {

            res.status(404).send({ message: 'Usuario no encontrado'})
        }
            
        } catch (error) {
            console.log('error al obtener la foto de perfil: ', error);
        }


    },

    changeOrderList: async (req, res, next) => {

        try {

        console.log(req.body);
        let books = req.body.list.books;
        let email = req.body.email;
        let idList = req.body.list.idList;

        for (let i = 0; i < books.length; i++) {
            console.log('Libro -> ', books[i].Titulo)
            
        }
        //console.log('Libros -> ', books);

        const clientesRef = collection(db, 'clientes');

        const clienteQuery = query(clientesRef, where('cuenta.email', '==', email));

        const clienteSnapshot = await getDocs(clienteQuery);

        if(!clienteSnapshot.empty){
            const clienteDoc = clienteSnapshot.docs[0];
            const clienteData = clienteDoc.data();
            console.log('idList -> ', idList)

            let listToUpdate = clienteData.lists.find(list => list.idList === idList);

            console.log('Lista a buscar: ', listToUpdate);
            if(listToUpdate) {
                listToUpdate.books = books;
                
                const clienteDocRef = doc(db, 'clientes', clienteDoc.id);

                await updateDoc(clienteDocRef, { lists: clienteData.lists });

            }
            
            res.status(200).send({message: 'Listas actualizadas correctamente'});

        } else {

            res.status(404).send({ message: 'Cliente no encontrado' });

        }

        
            
        } catch (error) {
            console.log('Error al actualizar las listas:', error);
            res.status(500).send({ message: 'Error interno del servidor' })
        }


    },

    uploadImagen: async (req,res,next)=>{
        try {
            //tengo q coger la extension del fichero, en req.body.imagen:  data:image/jpeg
            let _nombrefichero='imagen____' + req.body.emailcliente;//  + '.' + req.body.imagen.split(';')[0].split('/')[1]   ;
            console.log('nombre del fichero a guardar en STORGE...',_nombrefichero);
            let _result=await uploadString(ref(storage,`imagenes/${_nombrefichero}`), req.body.imagen,'data_url'); //objeto respuesta subida UploadResult         
        
            //podrias meter en coleccion clientes de firebase-database en prop. credenciales en prop. imagenAvatar
            //el nombre del fichero y en imagenAvatarBASE&$ el contenido de la imagen...
            let _refcliente=await getDocs(query(collection(db,'clientes'),where('cuenta.email','==',req.body.emailcliente)));
            _refcliente.forEach( async (result) => { 
                await updateDoc(result.ref, { 'cuenta.imagenAvatarBASE64': req.body.imagen } );
            });
            
            generaRespuesta(0,'Imagen avatar subida OK!!! al storage de firebase','',null,null,null,res );
        } catch (error) {
            console.log('error subida imagen...',error);
            generaRespuesta(5,'fallo a la hora de subir imagen al storage',error,null,null,null,res);

        }
    }
}