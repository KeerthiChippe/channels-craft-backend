const _ = require('lodash')
const { validationResult } = require ('express-validator')
const Channel = require ('../models/channel-model')
const Package = require('../models/package-model')
const CustomerProfile = require('../models/customerProfile-model')

const channelsCltr={}

//to create a channel
channelsCltr.create = async(req,res) =>{
    const errors =validationResult(req)
    
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const userId = req.user.id
    if(req.user.role == 'admin'){
        const body=_.pick(req.body, ['channelName','channelNumber' ,'channelPrice','language','image'])
        body.user=userId
        body.role=req.user.role
        try{
            const channel =new Channel (body)
            channel.image =req.file.filename
            
            channel.userId=req.user.id
            await channel.save()
            res.status(201).json(channel)
        }catch(err){
            // console.log(err)
            res.status(500).json(err)
        }
    }
}

// to view all the channels
channelsCltr.listAllChannels = async (req,res) => {
    try{
        const channel = await Channel.find()
        res.json(channel)
    }catch(err){
        // console.log(err)
        res.status(400).json(err)
    }
}

//to view single channel
channelsCltr.listOneChannel = async (req,res) =>{
    const id= req.params.id
    try{
        const channel = await Channel.findById(id)
        res.status(200).json(channel)
    }catch(err){
        res.status(400).json(err)
    }
}

//update channel
channelsCltr.updateChannel = async (req,res) =>{
    const errors= validationResult(req)
    if(!errors.isEmpty()){
        res.status(404).json({errors:errors.array()})
    }
    const id= req.params.id
    const body = _.pick(req.body, ['channelPrice'])
    try{  
        const channel = await Channel.findByIdAndUpdate(id,body,{new : true})
 
        res.status(200).json(channel)
    }catch(err){

        // console.log(err)

        res.status(400).json(err)
    }
}

//delete channel

channelsCltr.deleteChannel = async (req, res) =>{
    const id = req.params.id
    try{
        // Check if any customer is subscribed to this channel
        const customers = await CustomerProfile.find({"currentChannels.channelId": id })
        if (customers.length > 0) {
            return res.status(403).json({ message: "Cannot delete channel as it is subscribed by customers" })
        }
        const channel = await Channel.findByIdAndDelete(id)
        res.status(200).json(channel)
    }catch(err){
        // console.log(err)
        res.status(400).json(err)
    }
}



module.exports = channelsCltr