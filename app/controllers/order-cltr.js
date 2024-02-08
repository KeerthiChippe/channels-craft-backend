const {validationResult} = require('express-validator')
const _ = require('lodash')

const Order = require('../models/order-model')
const CustomerProfile = require('../models/customerProfile-model')

const ordersCltr = {}

ordersCltr.create = async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = _.pick(req.body, ["customerId", "operatorId", "packages", "channels", "status", "orderDate", "totalPrice"])
    try{
        const { customerId, operatorId, packages, channels, status } = req.body

        const packagePrice = packages.reduce((sum, package) => sum + package.packagePrice, 0)
        const channelPrice = channels.reduce((sum, channel) => sum + channel.channelPrice, 0)
        const totalPrice = Number(packagePrice) + Number(channelPrice)
        
        const order = new Order(body) 
        order.totalPrice = totalPrice

        if(req.user.role === 'operator'){
            order.operatorId = req.user.operator
            const customerProfile = await CustomerProfile.findOne({ 'operatorId': req.user.operator });
        if (customerProfile) {
            order.customerId = customerProfile.id;
        }
    }
        if(req.user.role === 'customer'){
            // order.customerId = req.user.id
            const user = await CustomerProfile.findOne({'userId': req.user.id})
            order.customerId = user.id
            order.operatorId = user.operatorId
        }
        await order.save()
        await CustomerProfile.findOneAndUpdate(
            {_id: order.customerId}, {$push: {currentPackages: order.packages, currentChannels: order.channels}}, {new: true}
        )
        res.status(201).json(order)
    }catch(e){
        res.status(500).json(e)
    }
}

ordersCltr.list = async (req, res)=>{
    try{
        const customerProfile = await CustomerProfile.findOne({'userId': req.user.id})
        console.log(customerProfile.id, "userid")
        const order = await Order.findOne({'customerId': customerProfile.id, status: 'success'}).populate({
            path: 'packages.packageId',
            select: 'packageName'
        }).populate({
            path: 'channels.channelId',
            select: 'channelName'
        })
        console.log(order, 'orderid')
        res.json({_id: order._id, packages: order.packages, channels: order.channels})
    }catch(e){
        res.status(500).json(e)
    }
}

module.exports = ordersCltr
