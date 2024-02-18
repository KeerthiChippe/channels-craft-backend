const packageValidationSchema = {
    packageName: {
        notEmpty: {
            errorMessage: 'Package name is required'
        }
    },
    packagePrice: {
        notEmpty: {
            errorMessage: 'price for the package is required'
        }
    },
    selectedChannels: {
        isLength: {
            options: {min: 1},
            errorMessage: 'minimum one channel is required'
        }
    }
}

const packageUpdateValidationSchema = {
    packagePrice: {
        notEmpty: {
            errorMessage: 'price is required'
        },
        isNumeric: {
            errorMessage: 'price should be a number'
        }
    }
}

module.exports = {
    packageSchema: packageValidationSchema,
    packageUpdateSchema: packageUpdateValidationSchema
}