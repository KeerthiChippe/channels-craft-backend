const jwt = require('jsonwebtoken')
const User = require('../models/user-model')

const authenticateUser = async (req, res, next)=>{
    const token = req.headers['authorization']
    try{
        if(!token){
            const usersCount = await User.countDocuments();
            if (usersCount === 0) {
                // Allow registration for the first user (admin)
                req.user = { role: 'admin' };
                return next();
            } else {
                return res.status(400).json({ errors: 'jwt token missing' });
            }
        }
        const tokenData = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(tokenData.id)
        if(!user.isActive){
            return res.json({notice: "Your account is deactivated, contact the admin of the site."})
        }

        if(tokenData.operator){
            req.user = {id: tokenData.id, role: tokenData.role, operator: tokenData.operator}
        }else{
            req.user = {id: tokenData.id, role: tokenData.role}
        }   
        next()
    }catch(e){
        res.status(401).json(e)
    }
}

// const authorizeUser = (roles)=>{
//     return (req, res, next)=>{
//         // console.log(req.user.role)
//         if(roles.includes(req.user.role)){
//             next()
//         }else{
//             res.status(400).json({errors: 'not authorized'})
//         }
//     }
// }

const authorizeUser = (roles) =>{
    return (req, res, next)=>{
        if(roles.includes(req.user.role)){
            //If the user is an admin
            if(req.user.role === 'admin'){
                //Allow admin to register operator
                req.body.role = 'operator'
            }
            //If the user is an operator
            else if(req.user.role == 'operator'){
                // Allow operator to register customer
                req.body.role = 'customer'
            }
            next()
        }else{
            res.status(400).json({errors: 'not authorized'})
        }
    }
}

module.exports = {
    authenticateUser : authenticateUser,
    authorizeUser: authorizeUser
}