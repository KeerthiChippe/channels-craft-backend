const mongoose = require ('mongoose')
const { Schema , model } = mongoose
const { addDays, format} = require('date-fns')

const dateFormat = format(new Date(), 'yyyy-MM-dd')
const expiryDate = addDays(dateFormat, 30) 

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
    // expDate: {
    //     type: Date,
    //     //  default: expiryDate
    //     default: function () {
    //         // Calculate expiry date 30 days from the current date
    //         return addDays(new Date(), 30);
    //     }
    // }
}, {timestamps: true})

const Payment = model("Payment", paymentSchema)
module.exports = Payment