const {validationResult} = require('express-validator')
const _ = require('lodash')
const { startOfMonth, endOfMonth } = require('date-fns')

const Order = require('../models/order-model')
const CustomerProfile = require('../models/customerProfile-model')

const ordersCltr = {}

ordersCltr.create = async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = _.pick(req.body, ["customerId", "operatorId", "packages", "channels", "status", "orderDate", "totalPrice"])
    const orderDate = new Date()
    try{
        const { customerId, operatorId, packages, channels, status } = req.body

        const packagePrice = packages.reduce((sum, package) => sum + package.packagePrice, 0)
        const channelPrice = channels.reduce((sum, channel) => sum + channel.channelPrice, 0)
        // console.log(packagePrice, typeof packagePrice, "hhhh")
        // console.log(channelPrice, typeof channelPrice, "kkkk")
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
        console.log(order, 'orderpack')
        res.status(201).json(order)
    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

ordersCltr.list = async (req, res)=>{
    try{
        const customerProfile = await CustomerProfile.findOne({'userId': req.user.id})
        // console.log(customerProfile.id, "userid")
        const order = await Order.find({'customerId': customerProfile.id, status: 'success'}).populate({
            path: 'packages.packageId',
            select: 'packageName'
        }).populate({
            path: 'channels.channelId',
            select: 'channelName'
        }).populate({
            path: 'orderDate'
        })
        res.json(order)
    }catch(e){
        res.status(500).json(e)
    }
}

ordersCltr.listAllOrders = async (req, res)=>{
    try{
        const order = await Order.find({status: 'success'}).populate({
            path: 'customerId',
            select: 'customerName'
        }).populate({
            path: 'operatorId',
            select: 'operatorName'
        }).populate({
            path: 'packages.packageId',
            select: 'packageName'
        }).populate({
            path: 'channels.channelId',
            select: 'channelName'
        }).populate({
            path: 'orderDate'
        })
        // console.log(order, "order")
        res.status(200).json(order)
    }catch(e){
        res.status(500).json(e)
    }
}

ordersCltr.buyAgain = async (req, res)=>{
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
      } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
}


module.exports = ordersCltr
