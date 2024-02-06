const mongoose = require ('mongoose')
const { Schema , model } = mongoose

const channelSchema = new Schema ({
    channelName:String,
    channelPrice:Number,
    language:String,
    isHD:{
        type:Boolean,
        default:true
    },
    channelNumber:Number,
    image:String  
},{ timestamps:true})

const Channel= model('Channel' , channelSchema)

module.exports = Channel
