const { validationResult } = require('express-validator')
const Payment = require('../models/payment-model')
const stripe = require('stripe')('sk_test_51OfgFJSAiFzFtt60BGeWYXj6pX9baqgU9TKnchRiQGF4d6WETjUujqrvgoz1dsSTO6Ib3oIVn5sywaP8FXq9cI4600IZ398ZRC')
const _ = require('lodash')
const CustomerProfile = require('../models/customerProfile-model')
const Order = require('../models/order-model')
const User = require('../models/user-model')
const nodemailer = require('nodemailer')
const OperatorProfile = require('../models/operatorProfile-model')
const { startOfMonth, subMonths, addDays } = require('date-fns');

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
        const subscribers = await Payment.find({status: 'success', activate: false, operatorId: req.user.operator}).populate({
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
        const payment = await Payment.findByIdAndUpdate({_id: paymentId, operatorId: req.user.operator}, {activate: true}, {new: true})
        
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
        const customer = await CustomerProfile.findOne({'_id': payment.customerId})
        const user = await User.findOne({'_id': customer.userId})
        const operator = await OperatorProfile.findOne({'_id': payment.operatorId})
        const operatorUser = await User.findOne({'_id': operator.userId})
        const order = await Order.findOne({'_id': payment.orderId}).populate({
            path: "packages.packageId channels.channelId",
            select: "packageName channelName"
        })
        let emailContent
        if(transactionType === 'update'){
            emailContent = `Dear ${customer.customerName},\n\n
                            Your payment with transaction ID ${payment.transactionId} has been successfully updated.\n 
                            Thank you for your purchase.\n
                            Your subscription details have been updated.`
        }else if(transactionType === 'activate'){
            emailContent = `Dear ${customer.customerName},\n\n
            Your subscription with transaction ID ${payment.transactionId} has been successfully activated.\n 
            Thank you for your purchase.\n
            You are now subscribed to the following packages and channels:\n
            PACKAGES\n
            ${order.packages.map(ele=> ele.packageId.packageName).join('\n')}\n
            CHANNELS\n
            ${order.channels.map(ele => ele.channelId.channelName).join('\n')}`

        }
        //Define email options
        const mailOptions = {
            from: process.env.GMAIL,
            to: `${user.email}`, // Assuming customer's email is stored in the CustomerProfile model
            subject: 'Payment Confirmation',
            text: emailContent
        };

        const operatorMailOptions = {
            from: process.env.GMAIL,
            to: `${operatorUser.email}`,
            subject: 'Payment Received - Activate Subscription',
            text: `A payment has been received from customer ${customer.customerName}. Please activate their packages and channels.`

        }

        // Send the email
        await transporter.sendMail(mailOptions)
        await transporter.sendMail(operatorMailOptions)
    } catch (error) {
        console.log("Error sending email notification:", error)
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

paymentsCltr.expiredOrders = async (req, res) => {
    try {
        const customer = await CustomerProfile.findOne({ 'userId': req.user.id });

        if (!customer) {
            return res.status(400).json({ message: "Customer not found" });
        }

        // Find all payments for the customer
        const payments = await Payment.find({
            customerId: customer._id,
            status: 'success',
            activate: true
        }).populate({
                         path: 'orderId',
                       populate: {
                           path: 'packages.packageId channels.channelId',
                            //  model: 'Package' // Assuming the model name for packages is 'Package'
                         }
                     });

        // Calculate thirty days ago for each payment
        const expiredOrders = payments.filter(payment => {
            const thirtyDaysAgo = new Date(payment.paymentDate);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() + 30); // Add 30 days
            // console.log(thirtyDaysAgo, 'date')
            const today = new Date();
            return today > thirtyDaysAgo; // Check if the payment is older than thirty days
        });

        res.json(expiredOrders);
    } catch (e) {
        console.log(e);
        res.status(500).json(e);
    }
}


paymentsCltr.listSubscribersLastThreeMonths = async (req, res)=>{
    try{
        const threeMonthsAgo = subMonths(new Date(), 3);
        const startOfCurrentMonth = startOfMonth(new Date());
        // console.log(threeMonthsAgo, 'threeMonthsAgo')
        const subscribers = await Payment.find({
            status: 'success',
            activate: true,
            operatorId: req.user.operator,
            paymentDate:  { $gte: threeMonthsAgo, $lte: startOfCurrentMonth }  // Filter payments in the last 3 months
        }).populate('customerId', 'customerName');
        res.json(subscribers);
    }catch(e){
        console.log(e);
        res.json(e);
    }
}

paymentsCltr.listIncomeLastThreeMonths = async (req, res)=>{
    try{
        const threeMonthsAgo = subMonths(new Date(), 3);
        const startOfCurrentMonth = startOfMonth(new Date());
        
        // Find all successful payments within the last three months
        const payments = await Payment.find({
            status: 'success',
            activate: true,
            operatorId: req.user.operator,
            paymentDate: { $gte: threeMonthsAgo, $lte: startOfCurrentMonth }
        });
        
        // Calculate total income
        const totalIncome = payments.reduce((total, payment) => total + payment.amount, 0);
        
        res.json({ totalIncome });
    } catch(e) {
        console.error('Error fetching income data:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

paymentsCltr.lastTenPayments = async (req, res) => {

    try {
        const lastTenPayments = await Payment.find({
            operatorId: req.user.operator,
            status: 'success',
            activate: true,
        }).sort({ paymentDate: -1 }).limit(10).populate('customerId', 'customerName').populate({
            path: 'orderId',
            populate: {
                path: 'packages.packageId channels.channelId',
                // model: 'Package',
                select: 'packageName channelName'
            }
            
        })

        res.json(lastTenPayments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


module.exports = paymentsCltr