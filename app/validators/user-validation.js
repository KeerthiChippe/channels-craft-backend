const User = require('../models/user-model')

const registerValidationSchema = {
    username: {
        notEmpty: {
            errorMessage: 'username is required'
        }
    },

    email: {
        notEmpty: {
            errorMessage: 'email is required'
        },
        isEmail: {
            errorMessage: 'Invalid email format'
        },
        custom: {
            options: async (value)=>{
                const user = await User.findOne({email: value})
                if(user){
                    throw new Error('email already taken')
                }else{
                    return true
                }
            }
        }
    },

    mobile: {
        notEmpty: {
            errorMessage: 'mobile number is required'
        },
        isLength: {
            options: {max: 10},
            errorMessage: 'mobile number should have 10 digits'
        },
        isNumeric: {
            errorMessage: 'mobile should be a number type'
        },
        custom: {
            options: async (value)=>{
                const user = await User.findOne({mobile: value})
                if(user){
                    throw new Error('mobile number already taken')
                }else{
                    return true
                }
            }
        }
    },

    password: {
        notEmpty: {
            errorMessage: 'password is required'
        },
        isLength: {
            options: {min:8, max: 128},
            errorMessage: 'password should be between 8-128 characters'
        }
    },

    // role: {
    //     notEmpty: {
    //         errorMessage: 'role is required'
    //     },
    //     isIn: {
    //         options: [['admin', 'operator', 'customer']],
    //         errorMessage: 'role should be either operator or customer'
    //     }
    // }  
}

const loginValidationSchema =  {
    mobile: {
        notEmpty: {
            errorMessage: 'mobile number is required'
        },
        isNumeric: {
            errorMessage: 'mobile should be a number type'
        },
        isLength: {
            options: {max: 10},
            errorMessage: 'mobile number should have 10 digits'
        }
    },

    password: {
        notEmpty: {
            errorMessage: 'password is required'
        },
        isLength: {
            options: {min: 8, max: 128},
            errorMessage: 'password should be 8-128 characters'
        }
    }
}

const userUpdateValidationSchema = {
    // isActive: {
    //     isBoolean: {
    //         errorMessage:'should be either true/false'
    //     }
    // },
    role: {
        notEmpty: {
            errorMessage: 'role should be provided'
        },
        isIn: {
            options: [['admin', 'operator', 'customer']],
            errorMessage: 'invalid role provided'
        }
    },
    username: {
        notEmpty: {
            errorMessage: 'username is required'
        }
    },

    email: {
        notEmpty: {
            errorMessage: 'email is required'
        },
        isEmail: {
            errorMessage: 'Invalid email format'
        }
    },

    mobile: {
        notEmpty: {
            errorMessage: 'mobile number is required'
        },
        isNumeric: {
            errorMessage: 'mobile should be a number type'
        },
        isLength: {
            options: {max: 10},
            errorMessage: 'mobile number should have 10 digits'
        }
    },

    password: {
        notEmpty: {
            errorMessage: 'password is required'
        },
        isLength: {
            options: {min: 8, max: 128},
            errorMessage: 'password should be 8-128 characters'
        }
    }

}

module.exports = {
    registerSchema: registerValidationSchema,
    loginSchema: loginValidationSchema,
    updateUserSchema: userUpdateValidationSchema
}
