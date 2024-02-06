const mongoose = require ('mongoose')
const { Schema , model } = mongoose

const paymentSchema = new Schema({
    paymentType: String,
    customerId :{
        type:Schema.Types.ObjectId,
        ref:"customerProfile"
    },
    operatorId :{
        type:Schema.Types.ObjectId,
        ref:"operator"
    },
    orderId:{
        type:Schema.Types.ObjectId,
        ref:"order"
    },
    amount: Number,
    paymentDate: Date,
    transactionId:String
}, {timestamps: true})

const Payment = model("Payment", paymentSchema)
module.exports = Payment