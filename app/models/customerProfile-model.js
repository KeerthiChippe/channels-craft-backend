const mongoose = require('mongoose')
const {Schema, model} = mongoose

const customerProfileSchema = new Schema({
    customerName: String,
    mobile: String,
    boxNumber:Number,
    address:{
            doorNumber:String,
            street:String,
            city:String,
            state:String,
            pincode:String
    },
    userId :{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    operatorId :{
        type:Schema.Types.ObjectId,
        ref:'OperatorProfile'
    },
    currentPackages: [{
        packageId: {
            type: Schema.Types.ObjectId,
            ref: 'Package'
        },
        expiryDateP: Date
    }],
    image:String,
    currentChannels: [{
        channelId: {
            type: Schema.Types.ObjectId,
            ref: 'Channel'
        },
        expiryDateC: Date
    }]

}, {timestamps: true})

const CustomerProfile = model('CustomerProfile', customerProfileSchema)

module.exports = CustomerProfile

// const sendReminderEmail = async (customer) => {
//     try {
//         // Fetch necessary data from the customer, user, and order databases
//         const userData = await User.findById(customer.userId);
//         const orderData = await Order.findOne({ customerId: customer._id }).sort({ orderDate: -1 });
        
//         // Calculate expiry date based on the latest order
//         const latestOrder = orderData.packages[0]; // Assuming the latest order is at index 0
//         const expiryDate = latestOrder.orderDate.setDate(latestOrder.orderDate.getDate() + 30); // Assuming subscription is valid for 30 days
        
//         // Use the calculated expiry date to send the reminder email
//         const mailOptions = {
//             from: 'chippekeerthi@gmail.com',
//             to: userData.email,
//             subject: 'Subscription Expiry Reminder',
//             text: `Hi ${userData.username},\n\nYour subscription is expiring on ${new Date(expiryDate).toLocaleDateString()}. Please renew your subscription to continue enjoying our services.\n\nBest Regards,\nYour Service Provider`,
//         };
        
//         await transporter.sendMail(mailOptions);
//         console.log('Reminder email sent successfully');
//     } catch (error) {
//         console.error('Error sending email:', error);
//     }
// };
