const mongoose = require ('mongoose')
const { Schema , model } = mongoose

const paymentSchema = new Schema({
    paymentType: String,
    customerId :{
        type:Schema.Types.ObjectId,
        ref:"CustomerProfile"
    },
    operatorId :{
        type:Schema.Types.ObjectId,
        ref:"OperatorProfile"
    },
    orderId:{
        type:Schema.Types.ObjectId,
        ref:"Order"
    },
    amount: Number,
    status: {
        type: String,
        enum: ['pending', 'success', 'failure'],
        default: 'pending'
    },
    paymentDate: Date,
    transactionId:String,
    activate: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const Payment = model("Payment", paymentSchema)
module.exports = Payment