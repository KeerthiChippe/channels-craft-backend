const { validationResult } = require('express-validator')
var nodemailer = require('nodemailer');
const _ = require('lodash')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user-model')
const OperatorProfile = require("../models/operatorProfile-model")

const usersCltr = {}

usersCltr.register = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const body = _.pick(req.body, ['username', 'email', 'mobile', 'password', 'role'])

        // if (!['admin', 'operator', 'customer'].includes(body.role)) {
        //     return res.status(400).json({ errors: 'Invalid role. Allowed roles are admin, operator, or customer.' });
        // }
        const user = new User(body)
        
        const salt = await bcryptjs.genSalt()
        const encryptedPassword = await bcryptjs.hash(user.password, salt)

        const usersCount = await User.countDocuments()
        if (usersCount === 0) { 
            user.role = 'admin'
        }
        // else if (usersCount > 0 ) {
        //     user.role = 'operator'
        // }else {
        //     user.role = 'customer'
        // }

        user.password = encryptedPassword

        await user.save()
        return res.status(201).json(user)
    } catch (e) {
        console.log(e)
        res.status(500).json(e)
    }
}

usersCltr.login = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const body = _.pick(req.body, ['mobile', 'password'])
    try {
        const user = await User.findOne({ mobile: body.mobile })
        if (!user) {
            return res.status(404).json({ errors: 'invalid mobile/password' })
        }
        const result = await bcryptjs.compare(body.password, user.password)
        if (!result) {
            return res.status(404).json({ errors: "invalid mobile/password" })
        }

        const operator = await OperatorProfile.findOne({ userId: user._id })

        if (operator) {
            const tokenData = {
                id: user._id,
                role: user.role,
                operator: operator._id
            }
            console.log(tokenData)

            const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '14d' })
            res.json({ token: token })
            
        } else {
            const tokenData = {
                id: user._id,
                role: user.role
            }
            console.log(tokenData)
            const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '14d' })
            res.json({ token: token })
        }
    } catch (e) {
        res.status(500).json(e)
    }
}

usersCltr.createUser = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    
    try {
        const body = _.pick(req.body, ['username', 'email', 'mobile', 'password', 'role'])
        if (body.role !== 'customer') {
            return res.status(400).json({ errors : 'Invalid role. Only customer allowed.' });
        }

        const user = new User(body)
        const salt = await bcryptjs.genSalt()
        const encryptedPassword = await bcryptjs.hash(user.password, salt)

        if (req.user.role == 'operator') {
            user.password = encryptedPassword
            user.operatorId = req.user.operator
            await user.save()
            return res.status(201).json(user)
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).json(e)
    }
}

usersCltr.forgotPassword = async (req, res) => {
    const body = _.pick(req.body, ['email'])
    try {
        const user = await User.findOne({ email: body.email })
        if (!user) {
            return res.status(400).json({ errors: 'user not found' })
        }
        // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '14d' })

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'chippekeerthi@gmail.com',
                pass: 'nyey oyoc omdm vobw'
            }
        });

        const tokenData = {email: body.email}
        const token = jwt.sign(tokenData,process.env.JWT_SECRET,{expiresIn : "10min"})
            res.status(200).json({token : token})

        var mailOptions = {
            from: 'chippekeerthi@gmail.com',
            to: `${user.email}`,
            subject: 'Reset your password',
            text: `<a href=http://localhost:3000/reset-password/${user._id}/${token}> Click here to reset your password</a>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                return res.send({Status: "success"})
            }
        });
    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

usersCltr.resetPassword = async(req, res)=>{
    const {id, token} = req.params
    const {password} = req.body   
            try{
                const decoded = jwt.verify(token,  process.env.JWT_SECRET)
                const salt = await bcryptjs.genSalt()
                const encryptedPassword = await bcryptjs.hash(password, salt)
                const user = await User.findOneAndUpdate({_id: id}, {password: encryptedPassword})
                if(!user){
                    return res.status(400).json({Status: "user not found"})
                }        
                res.send({Status: 'Success'})
            }catch(e){
                console.log(e)
                return res.status(500).json(e)
            }
}

usersCltr.createUser = async(req, res) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    const body = _.pick(req.body, ['username','email', 'mobile', 'password', 'role'])
    try{
        const user  = new User(body)
        const salt = await bcryptjs.genSalt()
        const encryptedPassword = await bcryptjs.hash(user.password, salt)
        if(req.user.role == 'admin'){
            user.password =encryptedPassword
            user.adminId = req.user.id
            await user.save()
            
        }else
        if(req.user.role == 'operator'){
            user.password = encryptedPassword
            user.operatorId = req.user.operator
            await user.save()
        }
        return res.status(201).json(user)

    }catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

usersCltr.profile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        res.json(user)
    } catch (err) {
        res.status(500).json(err)
    }
}

usersCltr.updateUser = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const id = req.params.id
    const body = _.pick(req.body, ['oldPassword', 'newPassword', 'mobile'])
    try {
        const user = await User.findByIdAndUpdate(id, body, { new: true })
        if (!user) {
            return res.status(404).json({ errors: 'user not found' })
        }

        const isCorrectPassword = await bcryptjs.compare(body.oldPassword, user.password)
        if (!isCorrectPassword) {
            return res.status(404).json({ errors: 'incorrect password' })
        }
        if (body.newPassword) {
            const salt = await bcryptjs.genSalt()
            const encryptedPassword = await bcryptjs.hash(body.newPassword, salt)
            user.password = encryptedPassword
        }
        await user.save()
        res.json(user)
    } catch (e) {
        res.json(e)
    }
}

usersCltr.deleteUser = async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findByIdAndDelete(id)
        res.json(user)
    } catch (e) {
        res.json(e)
    }
}

usersCltr.listAllUsers = async (req, res) => {
    if (req.user.role === 'admin' || 'operator') {
        try {
            const user = await User.find()
            res.json(user)
        } catch (e) {
            res.json(e)
        }
    } else {
        res.json({ errors: "you don't have access" })
    }
}

usersCltr.listSingleUser = async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findById(id)
        res.json(user)
    } catch (e) {
        res.status(500).json(e)
    }
}

module.exports = usersCltr