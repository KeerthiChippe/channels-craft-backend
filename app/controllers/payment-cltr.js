const { validationResult } = require('express-validator')
const Payment = require('../models/payment-model')
const stripe = require('stripe')('sk_test_51OfgFJSAiFzFtt60BGeWYXj6pX9baqgU9TKnchRiQGF4d6WETjUujqrvgoz1dsSTO6Ib3oIVn5sywaP8FXq9cI4600IZ398ZRC')
const _ = require('lodash')
const CustomerProfile = require('../models/customerProfile-model')
const Order = require('../models/order-model')

const paymentsCltr = {}

paymentsCltr.create = async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = _.pick(req.body, ['amount', 'orderId', 'operatorId', 'customerId'])
    
    const lineItems = [{
        price_data : {
            currency: "inr",
            product_data : {
                name: "price"
            },
            unit_amount: body.amount * 100
        },
        quantity: 1
    }]

    const customer = await stripe.customers.create({
        name: "Testing",
        address: {
            line1: 'India',
            postal_code: '517501',
            city: 'Tirupati',
            state: 'AP',
            country: 'US'
        },
    })

    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types : ['card'],
            line_items : lineItems,
            mode : "payment",
            success_url : `http://localhost:3000/success`,
            cancel_url : `http://localhost:3000/failure`,
            customer : customer.id
        })

        const payment = new Payment(body)
        const customerProfile = await CustomerProfile.findOne({'userId': req.user.id})
    
        payment.customerId = customerProfile.id
        payment.operatorId = customerProfile.operatorId

        payment.paymentType = "card"
        payment.transactionId = session.id
        payment.paymentDate = new Date()
        await payment.save()
        
        res.json({"id": session.id, "url": session.url})

    }catch(e){
        res.status(500).json(e)
    }
}

paymentsCltr.update = async (req, res)=>{
    const id = req.params.id
    try{
        const payment = await Payment.findOneAndUpdate({"transactionId": id}, {'status': 'success'}, {new: true})
        const order = await Order.findOneAndUpdate({'customerId': payment.customerId}, {status: 'success', orderDate: new Date()}, {new: true})
        res.json(payment)
    }catch(e){
        console.log(e)
    }
}

paymentsCltr.delete = async (req, res) =>{
    const id = req.params.id
    try{
        const payment = await Payment.findOneAndDelete({'transactionId': id})

        if(!payment){
            return res.status(404).json({"msg": "Not able to erase unsuccessfull payment record !"})
        }
        res.status(200).json({"msg": "Unsuccessfull payment record erased successfully !"})
    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

module.exports = paymentsCltr