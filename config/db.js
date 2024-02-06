const mongoose = require('mongoose')

const configureDB = async ()=>{
    try{
        await mongoose.connect('mongodb+srv://channels-craft:hushakeerthi@cluster0.pgihfax.mongodb.net/')
        console.log('successfully connected to db')
    }catch(e){
        console.log('error connecting to db', e.message)
    }
}

module.exports = configureDB