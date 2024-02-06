const { validationResult } = require('express-validator')
const Payment = require('../models/payment-model')
const stripe = require('stripe')('sk_test_51OfgFJSAiFzFtt60BGeWYXj6pX9baqgU9TKnchRiQGF4d6WETjUujqrvgoz1dsSTO6Ib3oIVn5sywaP8FXq9cI4600IZ398ZRC')
const _ = require('lodash')

const paymentsCltr = {}

paymentsCltr.create = async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = _.pick(req.body, ['amount', 'orderId'])
    
    const lineItems = [{
        price_data : {
            currency: "inr",
            product_data : {
                name: "charges"
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
        console.log(session, "7777")
        res.json({"id": session.id, "url": session.url})

    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

module.exports = paymentsCltr