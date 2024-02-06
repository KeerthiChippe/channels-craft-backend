
const paymentValidationSchema = {
    // type :{
    //     isIn:{
    //         options: [["Debit","Credit"]],
    //         errorMessage:"payment type shpuld be either debit or credit"
    //     }
    // },
    amount: {
        notEmpty: {
            errorMessage: 'amount is required'
        },
        isNumeric: {
            errorMessage: 'amount should be a number'
        }
    }
}

module.exports = {
    paymentValidation: paymentValidationSchema
}