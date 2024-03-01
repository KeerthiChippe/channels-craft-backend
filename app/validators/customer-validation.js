const CustomerProfile = require('../models/customerProfile-model')
const Package = require('../models/package-model')
const Channel = require('../models/channel-model')

const customerValidationSchema = {
    customerName: {
        notEmpty: {
            errorMessage: 'customer name is required'
        }
    },
    mobile: {
        notEmpty: {
            errorMessage: 'mobile is required'
        },
        isLength: {
            options: { max: 10 },
            errorMessage: 'mobile number is required'
        },
        isNumeric: {
            errorMessage: 'mobile should be a number type'
        },
    },
    boxNumber: {
        notEmpty: {
            errorMessage: 'box Number is required'
        },
        isNumeric: {
            errorMessage: 'box number should be number'
        },
        isLength: {
            options: { max: 15 },
        },
        custom:{
            options: async function (value){
                const existingboxNumber = await CustomerProfile.findOne({boxNumber:value })
                if(existingboxNumber){
                    throw new Error ('box number already exists')
                }else{
                    return true
                }
            }
        }
    },
    'address.doorNumber': {
        notEmpty: {
            errorMessage: 'door number is required'
        }
    },
    'address.street': {
        notEmpty: {
            errorMessage: 'street number is required'
        }
    },
    'address.city': {
        notEmpty: {
            errorMessage: 'city is required'
        }
    },
    'address.state': {
        notEmpty: {
            errorMessage: 'state is required'
        }
    },
    'address.pincode': {
        notEmpty: {
            errorMessage: 'pincode is required'
        },
        isNumeric: {
            errorMessage: 'pincode should be a numeric value'
        },
        isLength: {
            options: { max: 6 }
        }
    }
}

const customerUpdateValidationSchema = {
    mobile: {
        notEmpty: {
            errorMessage: 'mobile is required'
        },
        isLength: {
            options: { max: 10 },
            errorMessage: 'mobile number is required'
        }
    }
}

// const customerPackageValidationSchema = {
//     'currentPackages.packageId': {
//         custom: {
//             options: async function(value, { req } ){
//                 const package = await CustomerProfile.findOne({ packageId: req.user.id })
//                 if(package){ 
//                     throw new Error('package already created')
//                 }  else {
//                     return true 
//                 }
//             }
//         }
//     }
// }

module.exports = {
    customerSchema: customerValidationSchema,
    customerUpdateSchema: customerUpdateValidationSchema
    // customerPackageSchema: customerPackageValidationSchema
}
