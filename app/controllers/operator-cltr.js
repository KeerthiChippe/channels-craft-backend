const _ = require('lodash')
const { validationResult } = require('express-validator')

const OperatorProfile = require('../models/operatorProfile-model')
const User = require('../models/user-model')

const operatorsCltr = {}

operatorsCltr.create = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const body = _.pick(req.body, ['operatorName', 'mobile', 'state', 'city', 'userId'])
    // body.user = userId
    // body.role = req.user.role
    try {
        const operator = new OperatorProfile(body)
        // operator.adminId = req.user.id - if want, for this create admin field in schema and model.
        await operator.save()
        res.json(operator)
    }
    catch (e) {
        res.status(500).json(e)
    }   
}

operatorsCltr.listAllOperators = async (req, res) => {
    const search =req.query.search || ''
        const sortBy = req.query.sortBy || ''
        const order = req.query.order || 1
        let page = parseInt(req.query.page) || 1
        let limit = parseInt(req.query.limit) || 15
    try {
        const searchQuery={operatorName:{$regex:search , $options :'i'}}
        const sortQuery={}
        if (sortBy) {
            sortQuery[sortBy] = order === 'asc' ? 1 : -1;
        }
        // sortQuery[sortBy] = order === 'asc'? 1 : -1
        page = parseInt(page)
        limit =parseInt(limit)
        const operator = await OperatorProfile.find(searchQuery)
                                               .sort(sortQuery)
                                               .skip((page-1)*limit)
                                               .limit(limit)
        const total = await OperatorProfile.countDocuments(searchQuery)
        res.json({
            operator,
            total,
            page,
            totalpages:Math.ceil(total/limit)
        })
    } catch (e) {
        res.status(500).json(e)
    }
}

operatorsCltr.listSingleOperator = async (req, res) => {
    const id = req.params.operatorId
    try {
        const operator = await OperatorProfile.findById(id)
        res.json(operator)
    } catch (e) {
        res.status(500).json(e)
    }
}

operatorsCltr.updateOperator = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const id = req.params.operatorId
    const body = _.pick(req.body, ['mobile'])
    try {
        const updatedOperator = await OperatorProfile.findOneAndUpdate(
                { _id: id}, { mobile: body.mobile }, { new: true}
            );
            const user = await User.findOneAndUpdate(
                {'_id': updatedOperator.userId}, {'mobile': updatedOperator.mobile}, {new: true}
            )
            res.status(200).json(user)
    } catch (e) {
        res.status(500).json(e)
    }
}

operatorsCltr.deleteOperator = async (req, res) => {
    const id = req.params.operatorId
    try {
        const operator = await OperatorProfile.findByIdAndDelete(id)
        res.status(200).json(operator)
    } catch (e) {
        res.status(500).json(e)
    }
}

operatorsCltr.getProfile = async (req, res)=>{
    const userId = req.user.id;
    // const id = req.params.id
    try {
        const operator = await OperatorProfile.findOne({userId})
        res.json(operator)
    } catch (err) {
        res.status(500).json(err)
    }
}

operatorsCltr.profile = async (req, res)=>{
    const id = req.params.operatorId

    try {
        const updatedOperator = await OperatorProfile.findOneAndUpdate(
            { _id: id}, { image: req.file.filename }, { new: true}
        );
        res.status(200).json(updatedOperator)
    }catch(err){
        res.status(500).json(err)
    }
}

module.exports = operatorsCltr
