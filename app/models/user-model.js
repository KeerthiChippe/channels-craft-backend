const mongoose = require('mongoose')
const {Schema, model} = mongoose

const userSchema = new Schema({
    username: String,
    email: String,
    mobile: String,
    password: String,
    image: String,
    role: {
        type: String,
        enum: ['admin', 'operator', 'customer']
    },
    operatorId: {
        type: Schema.Types.ObjectId,
        ref: "OperatorProfile"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true})

const User = model('User', userSchema)

module.exports = User
