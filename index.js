const exp=require('express');



const mongo=require('mongoose');



const bc=require('bcrypt');




const jot=require('jsonwebtoken');


const {tb,ev}=require('express-validator');


const {ta,ra,bt}=require('./middleware');




const applications=exp();



applications.use(exp.json());




mongo.connect('mongodb+srv://lovely:lovely@cluster0.mx8x9dk.mongodb.net/?retryWrites=true&w=majority',{useNewUrlParser:true,useUnifiedTopology:true,useCreateIndex:true,})



.then(()=>{

  console.log("database connected");


})



.catch((er)=>{


  console.log("error in connecting");

  process.exit(1);


});




const client_scheme=new mongo.Schema({


    clientname:{type:String,required:true,unique:true,},

  privacy:{type:String,required:true,},

  post:{type:String,required: true,enum:['selling', 'buying'],},


});




const client=mongo.model('client',client_scheme);




const materials_scheme=new mongo.Schema({


  Name:{type:String,required:true,},


  bio:{type:String,required:true,},


});




const items=mongo.model('items',materials_scheme);



// Signup 
applications.post('/signup',[


  tb('clientname').notEmpty().withMessage('clientname is necessary'),


  tb('privacy').notEmpty().withMessage('privacy is necessary'),


  tb('post').notEmpty().withMessage('post is necessary'),



],


async(request,response)=>{


  const problem=ev(request);


  if(!problem.isEmpty()){

    return response.status(400).json({ problem:problem.array()});

  }




  try{


    const {clientname,privacy,post}=request.tb;

    const my_hashing=await bc.hash(privacy,5);

    const Clients=new client({clientname,privacy:my_hashing,post,});


    await Clients.save();


    response.sendStatus(201);


  } 




  catch(er){


    console.log("error");


    response.sendStatus(500);

  }



});




// Login 
applications.post('/login',async(request,response)=>{


  try{



    const {clientname,privacy}=request.tb;


    const Clients=await client.findOne({clientname});


    if(!Clients){

      return response.status(401).json({msg:"wrong credentials"});

    }



    const iscombine=await bc.compare(privacy,Clients.privacy);


    if(!iscombine){


      return response.status(401).json({msg:"wrong credentials"});


    }




    const at=jot.sign({clientname:Clients.clientname,post:Clients.post},'your_secret_key',{expIn:'1m'});


    const rt=jot.sign({clientname:Clients.clientname,post:Clients.post}, 'refresh_secret_key',{expIn:'5m'});


    response.json({at,rt});


  } 



  catch(er){



    console.log("error");

    response.sendStatus(500);


  }



});




// Logout 
applications.post('/logout',bt,(request,response)=>{


    response.sendStatus(200);



});




//Products 
applications.get('/item',ta,async (request, response)=>{



    try{


      const item=await items.find();


      response.json(item);

    } 



    catch(er){


      console.log("error");


      response.sendStatus(500);


    }



  });
  



  //add product
  applications.post('/addproducts',ta,ra('selling'),async(request,response)=>{


    const {Name,bio}=request.tb;



    try{


      const material=new items({Name,bio,});


      await material.save();


      response.sendStatus(201);
    } 



    catch(er){


      console.log("error");

      response.sendStatus(500);


    }

  });
  



  //delete product
  applications.delete('/deleteproducts/:id',ta,ra('selling'),async(request,response)=>{
    const my_id=request.params.id;



    try{


      await items.findByIdAndDelete(my_id);


      response.sendStatus(200);



    } 



    catch(er){



      console.log("error");


      response.sendStatus(500);


    }


  });
  



  
  applications.use((request,response)=>{


    response.sendStatus(404);



  });
  
  


  const my_port=process.env.PORT||8000;


  applications.listen(my_port,()=>{




    console.log(`port:${my_port}`);



    
  });