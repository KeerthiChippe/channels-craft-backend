const mongoose = require('mongoose')
const {Schema, model} = mongoose

const customerProfileSchema = new Schema({
    customerName: String,
    mobile: String,
    boxNumber:Number,
    address:{
            doorNumber:String,
            street:String,
            city:String,
            state:String,
            pincode:String
    },
    userId :{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    operatorId :{
        type:Schema.Types.ObjectId,
        ref:'OperatorProfile'
    },
    currentPackages: [{
        packageId: {
            type: Schema.Types.ObjectId,
            ref: 'Package'
        },
        expiryDateP: Date
    }],
    image:String,
    currentChannels: [{
        channelId: {
            type: Schema.Types.ObjectId,
            ref: 'Channel'
        },
        expiryDateC: Date
    }]

}, {timestamps: true})

const CustomerProfile = model('CustomerProfile', customerProfileSchema)

module.exports = CustomerProfile