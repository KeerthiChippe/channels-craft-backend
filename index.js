const express = require('express')
const { checkSchema } = require('express-validator')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const PORT = 3034
const app = express()
app.use(express.json())
app.use(cors())
require('dotenv').config()
app.use(express.static('public'))
const CustomerProfile = require('./app/models/customerProfile-model')
const package = require('./app/models/package-model')
const configureDB = require('./config/db')
configureDB()

const storage = multer.diskStorage({
    destination : function (req,file,cb) {
        return cb (null , "./public/Images")
    },
    filename:function(req,file,cb){
        return cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer ({storage})

//upload images
// app.post('/api/upload', upload.single('file'), (req, res) =>{
//     console.log(req.body)
//     console.log(req.file)
//     CustomerProfile.create({image:req.file.filename})
//     .then(result => res.json(result))
//     .catch(err => console.log(err))

// }) 
// app.post('/api/upload/operator', upload.single('file'), (req, res) =>{
//     console.log(req.body)
//     console.log(req.file)
//     OperatorProfile.create({image:req.file.filename})
//     .then(result => res.json(result))
//     .catch(err => console.log(err))

// }) 

// app.post('/api/upload-package', upload.single('file'), (req, res) =>{
//     console.log(req.body)
//     console.log(req.file)
//     package.create({image:req.file.filename})
//     .then(result => res.json(result))
//     .catch(err => console.log(err))

// }) 

// app.get('/api/getimage' , (req,res) =>{
//     CustomerProfile.find()
//     .then( customer => res.json(customer) )
//     .catch(err => console.log(err))
// })

// app.get('/api/getimage/:filename', (req, res) => {
//     const fileName = req.params.filename;
//     const filePath = path.join(__dirname, 'public/Images', fileName);
//     res.sendFile(filePath);
//   });
  

//user
const User = require('./app/models/user-model')
const usersCltr = require('./app/controllers/user-cltr')

//register and login
const { registerSchema, loginSchema, updateUserSchema } = require('./app/validators/user-validation')
const { authenticateUser, authorizeUser } = require('./app/middlewares/auth')

//operators
const { operatorSchema, operatorUpdateSchema } = require('./app/validators/operator-validation')
const operatorsCltr = require('./app/controllers/operator-cltr')

//packages
const { packageSchema, packageUpdateSchema } = require('./app/validators/package-validations')
const packagesCltr = require('./app/controllers/package-cltr')

//channels
const channelsCltr = require('./app/controllers/channel-cltr')
const { channelsSchema , channelUpdateSchema} = require('./app/validators/channel-validation')

//customers
const customerCltr = require('./app/controllers/customer-cltr')
const {customerSchema, customerUpdateSchema, customerPackageSchema} = require('./app/validators/customer-validation')

//orders
const { orderSchema } = require('./app/validators/order-validations')
const ordersCltr = require('./app/controllers/order-cltr')
// const CustomerProfile = require('./app/models/customerProfile-model')
const paymentsCltr = require('./app/controllers/payment-cltr')
const dashboardCltrs = require('./app/controllers/dashboard-cltr')

//users Api's
app.post('/api/users/register',authenticateUser, authorizeUser(['admin', 'operator']), checkSchema(registerSchema), usersCltr.register)
app.post('/api/users/login', checkSchema(loginSchema), usersCltr.login)
app.post('/api/forgot-password', usersCltr.forgotPassword)
app.post('/api/reset-password/:id/:token', usersCltr.resetPassword)
// app.post('/api/users/registeruser', authenticateUser, authorizeUser(['admin','operator']), checkSchema(registerSchema), usersCltr.createUser)
app.get('/api/users/profile', authenticateUser, usersCltr.profile)
app.put('/api/users/:id',authenticateUser, usersCltr.updateUser)
app.delete('/api/users/:id', authenticateUser, usersCltr.deleteUser)
app.get('/api/listAllUsers', authenticateUser, authorizeUser(['admin', 'operator', 'customer']), usersCltr.listAllUsers)
app.get('/api/listSingleUser/:id', authenticateUser, authorizeUser(['admin']), usersCltr.listSingleUser)

//operators api
app.post('/api/operator', authenticateUser, authorizeUser(['admin']), checkSchema(operatorSchema), operatorsCltr.create)
app.get('/api/listAllOperators', authenticateUser, authorizeUser(['admin','operator']), operatorsCltr.listAllOperators)
app.get('/api/listSingleOperator/:operatorId', authenticateUser, authorizeUser(['admin']), operatorsCltr.listSingleOperator)
app.get('/api/getOperatorByUserId/:userId', authenticateUser, authorizeUser(['admin', 'operator']), operatorsCltr.getOperatorByUserId)
app.put('/api/operator/:operatorId', authenticateUser, authorizeUser(['operator', 'admin']), checkSchema(operatorUpdateSchema), operatorsCltr.updateOperator)
app.put('/api/operator/:operatorId/profile', authenticateUser, authorizeUser(['operator']), upload.single('file'), operatorsCltr.profile)
app.delete('/api/operator/:operatorId', authenticateUser, authorizeUser(['admin']), operatorsCltr.deleteOperator)
app.get('/api/operator/profile', authenticateUser, authorizeUser(['operator']), operatorsCltr.getProfile)

//packages api's
app.post('/api/packages', authenticateUser, authorizeUser(['admin']), upload.single('file'), checkSchema(packageSchema), packagesCltr.create)
app.get('/api/listAllPackages', packagesCltr.listAllPackages)
app.get('/api/listOnePackage/:packageId', packagesCltr.listSinglePAckage)
app.put('/api/packages/:packageId', authenticateUser, authorizeUser(['admin']),upload.single('file'), checkSchema(packageUpdateSchema), packagesCltr.updatePackage)
app.delete('/api/packages', authenticateUser, authorizeUser(['admin']), packagesCltr.deletePackage)
app.get('/api/listAllDeletedPackages', authenticateUser, authorizeUser(['admin']), packagesCltr.listAllDeletedPackages)

//channels api
app.post('/api/channels',authenticateUser,authorizeUser(['admin']),upload.single('file'),checkSchema(channelsSchema),channelsCltr.create)
app.get('/api/listAllchannels',checkSchema(channelsSchema),channelsCltr.listAllChannels)
app.get('/api/listOneChannel/:id',checkSchema(channelsSchema),channelsCltr.listOneChannel)
app.put('/api/updateChannel/:id', authenticateUser, authorizeUser(['admin']),checkSchema(channelUpdateSchema),channelsCltr.updateChannel)
app.delete('/api/deleteChannel/:id', authenticateUser, authorizeUser(['admin']),channelsCltr.deleteChannel)

//customers api
app.post('/api/customers',authenticateUser, authorizeUser(['operator']), checkSchema(customerSchema),customerCltr.create)
app.get('/api/listAllCustomers',authenticateUser,authorizeUser(['operator', 'customer']),customerCltr.listAllCustomers)
app.get('/api/:operatorId/customers', authenticateUser, authorizeUser(['admin', 'operator']), customerCltr.getCustomersByOperatorId)
app.get('/api/:userId/users/customer', authenticateUser, authorizeUser(['admin', 'operator']), customerCltr.getCustomersByUserId)
app.get('/api/singleCustomer/:id',authenticateUser,authorizeUser(['operator', 'customer', 'admin']),customerCltr.singleCustomer)
app.put('/api/customer/:customerId', authenticateUser, authorizeUser(['customer','operator']), checkSchema(customerUpdateSchema), customerCltr.updateCustomer)
app.put('/api/customer/:customerId/profile', authenticateUser, authorizeUser(['customer']), upload.single('file'), customerCltr.profile)
app.delete('/api/customer/:id',authenticateUser,authorizeUser(['operator']),customerCltr.deleteCustomer)
app.get('/api/customer/profile', authenticateUser, authorizeUser(['customer']), customerCltr.getProfile)

//orders api
app.post('/api/orders', authenticateUser, authorizeUser(['operator', 'customer']), checkSchema(orderSchema), ordersCltr.create)
app.get('/api/orders', authenticateUser, authorizeUser(['customer']), ordersCltr.list)
app.get('/api/allorders', authenticateUser, authorizeUser(['admin']), ordersCltr.listAllOrders)
app.get('/api/orders/:orderId', authenticateUser, authorizeUser(['customer']), ordersCltr.buyAgain)

// app.get('/api/orders/:operatorId', authenticateUser, authorizeUser(['operator']), ordersCltr.fetchOrdersWithCustomerDetails)

//payments api
app.get('/api/payment/subscribers', authenticateUser, authorizeUser(['operator']), paymentsCltr.listSubscribers)
app.get('/api/payment/subscribersLastThreeMonths', authenticateUser, authorizeUser(['operator']), paymentsCltr.listSubscribersLastThreeMonths);
app.get('/api/payment/listIncomeLastThreeMonths', authenticateUser, authorizeUser(['operator']), paymentsCltr.listIncomeLastThreeMonths)
app.get('/api/payment/listLastTenPayments', authenticateUser, authorizeUser(['operator']), paymentsCltr.lastTenPayments)
app.post('/api/payment', authenticateUser, authorizeUser(['customer']), paymentsCltr.create)
app.get('/api/payment/expiredOrders', authenticateUser, authorizeUser(['customer']), paymentsCltr.expiredOrders)
app.put('/api/payment/:id', authenticateUser, authorizeUser(['customer']), paymentsCltr.update)
// app.post('/api/orders/:id/activate', authenticateUser, authorizeUser(['operator']), ordersCltr.activateSubscription)
app.put('/api/payment/:id/activate', authenticateUser, authorizeUser(['operator']), paymentsCltr.activateSubscription)
app.delete('/api/payment/:id', authenticateUser, authorizeUser(['customer']), paymentsCltr.delete)
//dashboard api
app.get('/api/operator-customers', authenticateUser, authorizeUser(['admin']), dashboardCltrs.getAllUsers)
app.get('/api/trendingPackages', dashboardCltrs.trendingPackages)


app.listen(PORT, ()=>{
    console.log('server running on port', PORT)
})
