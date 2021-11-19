const mongoose = require('mongoose');
const dotenv = require('dotenv')
require('dotenv').config();
const mongoURI =  process.env.MONGODB_CONNECTION_URL;
const connectToMongo = ()=>{
mongoose.connect(mongoURI,{useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
    console.log("Connected to Mongo Sucessfully")
    }).catch(error=>{
        console.log('Error :',error.message); 
    })
}
module.exports = connectToMongo;