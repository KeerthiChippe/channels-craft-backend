const _ = require('lodash')
const {validationResult} = require('express-validator')

const Package = require('../models/package-model')
const Channel = require('../models/channel-model')
const CustomerProfile = require('../models/customerProfile-model')

const packagesCltr = {}

packagesCltr.create = async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
        const body = _.pick(req.body, ['packageName', 'packagePrice', 'selectedChannels','image'])
        try{
            const package = new Package(body)
            package.image = req.file.filename
            const selectedChannels = await Channel.findOne({ channelName: body.selectedChannels });
            if (!selectedChannels){
                return res.status(404).json({ errors: 'Selected channels not found' });
            }
            package.channels = [selectedChannels]

            package.userId = req.user.id
            await package.save()
            res.status(201).json(package)
        }catch(e){
            res.status(500).json(e)
        }    
}

packagesCltr.listAllPackages = async (req, res)=>{
    try{
        const packages = await Package.find({isDeleted: false})
        const packagesWithChannels = await Promise.all(packages.map(async (pkg) => {
            const selectedChannels = await Promise.all(pkg.selectedChannels.map(async (channelName) => {
              const channel = await Channel.findOne({ channelName })
              if(channel){
                return { channelName, image: channel.image }
              }else {
                        return { channelName, image: null } // Provide a default image URL
                    }
            }));
            return { ...pkg.toObject(), selectedChannels }
          }));
          res.json(packagesWithChannels);
        // res.json(package)
    }catch(e){
        console.log(e)
        res.status(400).json(e)
    }
}

packagesCltr.listSinglePAckage = async (req, res) =>{
    const id = req.params.packageId
    try{
        const package = await Package.findById(id)
        res.status(200).json(package)
    }catch(e){
        res.status(500).json(e)
    }
}

packagesCltr.updatePackage = async (req, res) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const id = req.params.packageId
    const body = _.pick(req.body, ['packagePrice'])
    try{
        const package = await Package.findByIdAndUpdate(id, body, {new: true})
        res.status(200).json(package)
    }catch(e){
        res.status(500).json(e)
    }
}

packagesCltr.deletePackage = async (req, res) =>{
    const {id, type} = req.query
    try{
        const customers = await CustomerProfile.find({"currentPackages.packageId": id });
        if (customers.length > 0) {
            return res.status(403).json({ message: "Cannot delete package as it is subscribed by customers" });
        }
        let package
        if(type === 'delete'){
            package = await Package.findByIdAndUpdate(id, {isDeleted: true}, {new: true})
        }else if(type === 'undo'){
            package = await Package.findByIdAndUpdate(id, {isDeleted: false}, {new: true})
        }
         
        if (!package) {
            return res.status(404).json({ error: 'Package not found' });
        }
        res.status(200).json(package)
    }catch(e){
        res.status(500).json(e)
    }
}

packagesCltr.listAllDeletedPackages = async (req, res) =>{
    try{
        const package = await Package.find({isDeleted: true})
        res.json(package)
    }catch(e){
        res.status(400).json(e)
    }
}


module.exports = packagesCltr