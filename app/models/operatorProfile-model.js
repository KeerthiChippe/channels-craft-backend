const mongoose = require('mongoose')
const {Schema, model} = mongoose

const operatorProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    operatorName: String,
    mobile: String,
    state: String,
    city: String,
    image:String,
}, {timestamps: true})

const OperatorProfile = model('OperatorProfile', operatorProfileSchema)

module.exports = OperatorProfile



