const mongoose = require('mongoose')
const {Schema , model} = mongoose

const orderSchema = new Schema ({
    customerId: {
        type:Schema.Types.ObjectId,
        ref:'CustomerProfile'
    },
    operatorId: {
        type:Schema.Types.ObjectId,
        ref:'OperatorProfile'
    },
    packages: [{
        packageId: {
                type:Schema.Types.ObjectId,
                ref:'Package'
        },
        packagePrice: Number
    }],
    channels: [{
        channelId: {
            type: Schema.Types.ObjectId,
            ref: 'Channel'
        },
        channelPrice: Number
    }],
    totalPrice:Number,
    orderDate:Date,
    status:{
        type: String,
        default: 'pending',
        enum:['pending', "success", "failure"]
    }
},{timestamps:true})

const Order = model ('Order', orderSchema)

module.exports = Order