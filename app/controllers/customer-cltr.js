const { validationResult } = require ('express-validator') 
const _ = require('lodash')
var nodemailer = require('nodemailer');
const cron = require('node-cron')
const { addDays, format } = require('date-fns');
const CustomerProfile = require('../models/customerProfile-model')
const User =  require('../models/user-model')
const OperatorProfile = require('../models/operatorProfile-model')
const Order = require('../models/order-model')

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
        // console.log(err)
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

customerCltr.assignPackage = async (req, res) => {
    try {
      const customerId = req.params.customerId;
      const packageId = req.body.packageId;
    //  const packageName = req.body.packageName
      const expiryDate = req.body.expiryDate || new Date(); 
  
      const customer = await CustomerProfile.findOne({ _id: customerId });
  
      if (!customer) {
        return res.status(404).json({ errors: 'Customer not found' });
      }
  
      // Check if package already exists for the customer
      const existingPackage = customer.currentPackages.find(p => p.packageId === packageId);

      if (existingPackage) {
        return res.status(400).json({ errors: 'Package already assigned to customer' });
      }
  
      // Push the new package to the customer's array
    //   customer.currentPackages.push({
    //     packageId: packageId,
    //     // packageName: packageName,
    //     expiryDate: expiryDate
    //   });
    const customera = await CustomerProfile.findOneAndUpdate({ _id: customerId }, { $push: { currentPackages: { packageId, expiryDate }}})
  
  
    //   res.json({ message: 'Package assigned successfully' });
      res.json(customera)
    } catch (err) {
    //   console.error(err);
      res.status(500).json({ errors: 'Failed to assign package' });
    }
  };
  
customerCltr.assignChannel = async (req, res)=>{
    try{
        const customerId = req.params.customerId
        const channelId = req.body.channelId
        const expiryDate = req.body.expiryDate || new Date()

        const customer = await CustomerProfile.findOne({_id: customerId})

        if(!customer){
            return res.status(400).json({errors: 'customer not found'})
        }

        const existingChannel = customer.currentChannels.find(c => c._id === channelId)
        if(existingChannel){
            return res.status(400).json({errors: 'Channel already assigned to customer'})
        }

        customer.currentChannels.push({
            channelId: channelId,
            expiryDate: expiryDate
        })
        await customer.save()
        res.json(customer)
    }catch(err){
        res.status(500).json({ errors: 'Failed to assign channel' });
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
      user: 'chippekeerthi@gmail.com',
      pass: 'nyey oyoc omdm vobw',
    },
  });

  // Function to calculate subscription expiry date
const calculateExpiryDate = () => {
    const expiryDate = addDays(new Date(), 4); // Assuming the subscription lasts for 30 days
    // console.log(expiryDate, 'expiryDate')
    return expiryDate;
   
};
// console.log(calculateExpiryDate(), 'calculateExpiryDate')

const sendReminderEmail = async () => {
    try {
        const customerId = "65cc5d960646d8eddca1dc90"
        const customer = await CustomerProfile.findOne({_id: customerId})
        // console.log(customer, 'customer')
        const userData = await User.findById(customer.userId);
        // console.log(userData, 'userData')
      const expiryDate = calculateExpiryDate();
    //   console.log(expiryDate, 'expiry')
      // Use the calculated expiry date to send the reminder email
      const mailOptions = {
        from: 'chippekeerthi@gmail.com',
        to: `chippekeerthi02@gmail.com`,
        subject: 'Subscription Expiry Reminder',
        text: `Hi ${customer.customerName},\n\nYour subscription is expiring on ${format(expiryDate, 'dd MMMM yyyy')}. Please renew your subscription to continue enjoying our services.\n\nBest Regards,\nYour Service Provider`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`Reminder email sent to email`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
//   console.log(sendReminderEmail, 'sendReminderEmail')

  cron.schedule('11 9 * * *', async () => {
    try {
      const today = new Date();
      const expiryDateThreshold = addDays(today, 4); // Get the threshold date (five days from today)
    // console.log(expiryDateThreshold, 'expiryDateThreshold')
      // Find orders/payments that are expiring within the threshold date
    //   const orders = await Order.find({ paid: { $lte: expiryDateThreshold } }).populate('customerI');
    const orders = await Order.find({ orderDate: { $lte: today } }).populate('customerId');
    // console.log(orders, 'orders')
      // Send reminder emails to customers associated with these orders
   
    for (const order of orders) {
        const expiryDate = calculateExpiryDate(order.orderDate);
        // await sendReminderEmail(order.customerId, expiryDate);
    }
    } catch (error) {
      console.error('Error:', error);
    }
  }, {
    // scheduled: true,
    timezone: 'Asia/Kolkata', // Set your timezone
  });
  

module.exports = customerCltr

