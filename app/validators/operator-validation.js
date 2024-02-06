const operatorValidationSchema = {
    operatorName: {
        notEmpty: {
            errorMessage: 'name is required'
        }
    },
    mobile: {
        notEmpty: {
            errorMessage: 'mobile number is required'
        },
        isLength: {
            options: {max: 10},
            errorMessage: 'mobile number should contain 10 characters'
        },
        isNumeric: {
            errorMessage: 'mobile should be a number type'
        },
    },
    state: {
        notEmpty: {
            errorMessage: 'state name is required'
        }
    },
    city: {
        notEmpty: {
            errorMessage: 'city is required'
        }
    }
    // role: {
    //     notEmpty: {
    //         errorMessage: 'role is required'
    //     },
    //     isIn: {
    //         options: [['admin', 'operator', 'customer']],
    //         errorMessage: 'role should be either candidate or recruiter'
    //     }
    //}  
}

const operatorUpdateValidationSchema = {
    mobile: {
        notEmpty: {
            errorMessage: 'mobile number is required'
        },
        isLength: {
            options: {max: 10},
            errorMessage: 'mobile number should contain 10 characters'
        }
    }
}

module.exports = {
    operatorSchema: operatorValidationSchema,
    operatorUpdateSchema: operatorUpdateValidationSchema
}
