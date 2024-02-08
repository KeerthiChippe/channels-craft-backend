const { validationResult } = require ('express-validator') 
const _ = require('lodash')

const CustomerProfile = require('../models/customerProfile-model')
const User =  require('../models/user-model')
const OperatorProfile = require('../models/operatorProfile-model')

const customerCltr={}

//to add customer
customerCltr.create = async ( req,res ) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const body = _.pick(req.body,['mobile','customerName','address','boxNumber', 'currentPackages', 'currentChannels', 'expiryDate', 'userId','operatorId'])
    try{
        const customer = new CustomerProfile(body)
        customer.operatorId = req.user.operator
        await customer.save()
        res.status(201).json(customer)
       
    }catch(err){
        res.status(500).json(err)
    }
}

//to view all the customers
customerCltr.listAllCustomers = async (req,res) =>{
    try{
        const customer = await CustomerProfile.find()
        res.json(customer)
    }catch(err){
        res.status(400).json(err)
    }
}

// to view one customer
customerCltr.singleCustomer = async (req,res) =>{
    const id = req.params.id
    try{
    const customer = await CustomerProfile.findOne({_id: id, operatorId: req.user.operator})
    res.json(customer)
    }catch(err){
        res.status(400).json(err)
    }
}


// //to update customer
customerCltr.updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.customerId;
    const body = _.pick(req.body, ['mobile']);
    try {
        // if(req.user.role === 'operator'){
        //     const updatedOperator = await OperatorProfile.findOneAndUpdate(
        //         { _id: id},
        //         { mobile: body.mobile },
        //         { new: true}
        //     );
        //     const user = await User.findOneAndUpdate(
        //         {'_id': updatedOperator.userId}, {'mobile': updatedOperator.mobile}, {new: true}
        //     )

        //     return res.status(200).json(user)
        // }
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
            customer = await CustomerProfile.findOne({_id: id, operatorId: req.user.operator})
        }

        if(!customer){
            return res.status(401).json({errors: 'record not found'})
        }

        res.status(201).json(customer)
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
      console.error(err);
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
        res.json(customer)
    }catch(e){
        res.status(500).json(e)
    }
}

module.exports = customerCltr
