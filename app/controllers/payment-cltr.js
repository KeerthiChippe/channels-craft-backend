const { validationResult } = require('express-validator')
const Payment = require('../models/payment-model')
const stripe = require('stripe')('sk_test_51OfgFJSAiFzFtt60BGeWYXj6pX9baqgU9TKnchRiQGF4d6WETjUujqrvgoz1dsSTO6Ib3oIVn5sywaP8FXq9cI4600IZ398ZRC')
const _ = require('lodash')
const CustomerProfile = require('../models/customerProfile-model')
const Order = require('../models/order-model')
const User = require('../models/user-model')
const nodemailer = require('nodemailer')

const paymentsCltr = {}
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.PASS
    }
});

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
        const order = await Order.findOneAndUpdate({'customerId': payment.customerId, "_id": payment.orderId}, {status: 'success', orderDate: new Date()}, {new: true})

        await sendEmailNotification(payment, 'update')

        res.json(payment)
    }catch(e){
        console.log(e)
    }
}

paymentsCltr.listSubscribers = async (req, res)=>{
    try{
        // const subscribers = await Payment.find({status: 'success', activate: false})
        const subscribers = await Payment.find({status: 'success', activate: false}).populate({
            path: 'customerId', 
            select: 'customerName'
        }).populate({
            path: 'orderId',
            select: 'packages.packageId'
        })
        // console.log(subscribers, 'subscribe')
        res.json(subscribers)
    }catch(e){
        console.log(e)
        res.json(e)
    }
}

paymentsCltr.activateSubscription = async (req, res)=>{
    const paymentId = req.params.id
    try{
        const payment = await Payment.findByIdAndUpdate({_id: paymentId}, {activate: true}, {new: true})
        
        await sendEmailNotification(payment, 'activate')
        res.status(200).json(payment)
    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

async function sendEmailNotification(payment, transactionType) {
    try {
        // Fetch necessary data for email content
        const customer = await CustomerProfile.findOne({'_id': payment.customerId});
        const user = await User.findOne({'_id': customer.userId})
        const order = await Order.findOne({'_id': payment.orderId}).populate({
            path: "packages.packageId channels.channelId",
            select: "packageName channelName"
        })
        
        // const emailContent = `Dear ${customer.customerName},\n\n
        //                         Your payment with transaction ID ${payment.transactionId} has been successfully processed.\n 
        //                         Thank you for your purchase.\n
        //                         Your are subscribed for: \n
        //                         PACKAGES\n
        //                         ${order.packages.map(ele=> ele.packageId.packageName).join('\n')}\n
        //                         CHANNELS\n
        //                         ${order.channels.map(ele => ele.channelId.channelName).join('\n')}`;

        let emailContent
        if(transactionType === 'update'){
            emailContent = `Dear ${customer.customerName},\n\n
                            Your payment with transaction ID ${payment.transactionId} has been successfully updated.\n 
                            Thank you for your purchase.\n
                            Your subscription details have been updated.`;
        }else if(transactionType === 'activate'){
            emailContent = `Dear ${customer.customerName},\n\n
            Your subscription with transaction ID ${payment.transactionId} has been successfully activated.\n 
            Thank you for your purchase.\n
            You are now subscribed to the following packages and channels:\n
            PACKAGES\n
            ${order.packages.map(ele=> ele.packageId.packageName).join('\n')}\n
            CHANNELS\n
            ${order.channels.map(ele => ele.channelId.channelName).join('\n')}`;

        }
        //Define email options
        const mailOptions = {
            from: process.env.GMAIL,
            to: `${user.email}`, // Assuming customer's email is stored in the CustomerProfile model
            subject: 'Payment Confirmation',
            text: emailContent
        };

        // Send the email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log("Error sending email notification:", error);
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