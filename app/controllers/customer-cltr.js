const { validationResult } = require ('express-validator') 
const _ = require('lodash')
var nodemailer = require('nodemailer');
const cron = require('node-cron')
const { addDays, format } = require('date-fns');
const CustomerProfile = require('../models/customerProfile-model')
const User =  require('../models/user-model')
const OperatorProfile = require('../models/operatorProfile-model')
const Order = require('../models/order-model')
const Payment = require('../models/payment-model')

const customerCltr={}

//to add customer
customerCltr.create = async ( req,res ) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const body = _.pick(req.body,['mobile','customerName','address','boxNumber', 'currentPackages', 'currentChannels', 'expiryDate', 'userId','image'])
    try{
        const customer = new CustomerProfile(body)
        customer.operatorId = req.user.operator
        await customer.save()

        // Fetching user details to get the email
        const user = await User.findById(body.userId)
       

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL,
                pass: process.env.PASS
            }
        });
        var mailOptions = {
            from: process.env.GMAIL,
            to: `${user.email}`,
            subject: 'Customer Account Created',
            html:
                `<h2>Your Account has been created successfully</h2>
                <p>Dear ${user.username},</p>
                <p>Here are your credentials:</p>
                <p>Mobile: ${body.mobile}</p>
                <p>Password: ${user.password}(as per your system's policy)</p>
                <p>Please keep your credentials safe.</p>
                <p>Thank you.</p>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                return res.send({ Status: "success" })
            }
        });
        res.status(201).json(customer)
       
    }catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}

//to view all the customers
customerCltr.listAllCustomers = async (req,res) =>{
    try{
        const operator = await OperatorProfile.findOne({userId: req.user.id})
        const customer = await CustomerProfile.find({operatorId: operator._id})
        res.json(customer)
    }
    catch(err){
        res.status(400).json(err)
    }
}

customerCltr.getCustomersByOperatorId = async (req, res) => {
    try {
      const { operatorId } = req.params;
      const customers = await CustomerProfile.find({ operatorId });
    //   console.log(customers, "hhhh")
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers by operator ID:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


customerCltr.getCustomersByUserId = async (req, res)=>{
    try{
        const {userId} = req.params
        const customers = await CustomerProfile.find({userId}).populate({
            path: 'currentPackages.packageId',
            select: 'packageName'
        }).populate({
            path: 'operatorId',
            select: 'operatorName'
        })
        res.json(customers)
    }catch(err){
        console.log(err)
        res.status(500).json(e)
    }
}
// // to view one customer
// customerCltr.singleCustomer = async (req,res) =>{
//     const id = req.params.id
//     try{
//     const customer = await CustomerProfile.findOne({_id: id, operatorId: req.user.operator})
//     res.json(customer)
//     }catch(err){
//         console.log(err)
//         res.status(400).json(err)
//     }
// }
customerCltr.singleCustomer = async (req, res) => {
    const id = req.params.id;
    try {
        // Check if the authenticated user is an operator or customer
        if (req.user.role === 'operator') {
            // If the authenticated user is an operator, they can view any customer's profile
            const customer = await CustomerProfile.findOne({ _id: id });
            if (customer) {
                res.json(customer);
            } else {
                res.status(404).json({ message: 'Customer not found' });
            }
        } else if (req.user.role === 'customer') {
            // If the authenticated user is a customer, they can only view their own profile
            const customer = await CustomerProfile.findOne({ _id: id, userId: req.user.id });
            if (customer) {
                res.json(customer);
            } else {
                res.status(404).json({ message: 'Customer not found' });
            }
        } else {
            // Handle other roles if necessary
            res.status(403).json({ message: 'Forbidden' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

 //to update customer
customerCltr.updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.customerId;
    const body = _.pick(req.body, ['mobile']);
    try {
        const updatedCustomer = await CustomerProfile.findOneAndUpdate(
            { _id: id},
            { mobile: body.mobile },
            { new: true}
        );

        const user = await User.findOneAndUpdate(
            {'_id': updatedCustomer.userId}, {'mobile': updatedCustomer.mobile}, {new: true}
        )
        
        res.status(200).json(user)
    } catch (e) {
        res.status(500).json(e);
    }
};

//to delete customer
customerCltr.deleteCustomer = async (req,res) =>{
    const id = req.params.id
    try{
        let customer
        if(req.user.role == 'operator'){
            customer = await CustomerProfile.findOneAndDelete({_id: id, operatorId: req.user.operator})
        }
        const user = await User.findOneAndDelete({'_id': customer.userId})

        if(!customer){
            return res.status(401).json({errors: 'record not found'})
        }

        res.status(201).json(user)
    }catch(err){
        res.status(400).json(err)
    }
}

customerCltr.profile = async(req , res) =>{
    const id = req.params.customerId
    try{
        const updatedCustomer = await CustomerProfile.findOneAndUpdate(
            {_id:id} , {image : req.file.filename} ,{ new:true }
        )
        res.status(200).json(updatedCustomer)
    }catch(err){
        res.status(500).json(err)
    }
}


customerCltr.getProfile = async (req, res)=>{
    const userId = req.user.id
    try{
        const customer = await CustomerProfile.findOne({userId})
        customer.userId = req.user.id
        // console.log(customer, "cus")
        res.json(customer)
    
    }catch(e){

        res.status(500).json(e)
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.PASS,
    },
  });

const sendReminderEmail = async (customerName, userEmail, expiryDate) => {
    try {
      const mailOptions = {
        from: process.env.GMAIL,
        to: userEmail,
        subject: 'Subscription Expiry Reminder',
        text: `Hi ${customerName},\n\nYour subscription is expiring on ${expiryDate}. Please renew your subscription to continue enjoying our services.\n\nBest Regards,\nYour Service Provider`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`Reminder email sent to email`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
//   console.log(sendReminderEmail, 'sendReminderEmail')

  cron.schedule('30 8 * * *', async () => {
    try {
      const payments = await Payment.find({status: 'success', activate: true})
      const currentDate = new Date();
      for (const payment of payments) {
        const expiryDate = addDays(new Date(payment.paymentDate), 30); // Calculate expiry date
        const reminderDate = addDays(expiryDate, -7); // Calculate reminder date (one week before expiry)
        
        if (currentDate >= reminderDate && currentDate < expiryDate) {
        // Format dates for logging
        const formattedExpiryDate = format(expiryDate, 'yyyy-MM-dd');
        const formattedReminderDate = format(reminderDate, 'yyyy-MM-dd');
  
        // Log expiry date and reminder date
        // console.log(`Payment ID: ${payment._id}`);
        // console.log(`Expiry Date: ${formattedExpiryDate}`);
        // console.log(`Reminder Date: ${formattedReminderDate}`);
        const customer = await CustomerProfile.findById(payment.customerId);
        const user = await User.findById(customer.userId);
        await sendReminderEmail(customer.customerName, user.email, formattedExpiryDate);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Set your timezone
  });
  

module.exports = customerCltr

