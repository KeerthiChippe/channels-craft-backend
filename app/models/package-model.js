const mongoose = require('mongoose')
const {Schema, model} = mongoose

const packageSchema = new Schema({
    packageName: String,
    image:String,
    packagePrice: Number,
    selectedChannels: [String],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const Package = model('Package', packageSchema)

module.exports = Package