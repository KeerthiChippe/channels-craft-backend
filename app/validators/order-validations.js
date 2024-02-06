const Order = require ( '../models/order-model')

const orderValidationSchema = {
    // orderDate: {
    //     isDate: {
    //        errorMessage: 'Date should be in valid format',
    //        format: 'YYYY-MM-DD'
    //     }
      //   custom: {
      //      options: (value) => {
      //         const today = new Date()
      //         today.setHours(0, 0, 0, 0);
      //         //const year = today.getFullYear(), month = today.getMonth() + 1, day = today.getDate()
      //         if (new Date(value) < today) {
      //            throw new Error('order date cannot be earlier than today')
      //         } else {
      //            return true
      //         }
      //      }
      //   }
    //  },
    //  status:{
    //     notEmpty:{
    //         errorMessage:"status should not be empty"
    //     }
    //  }
}

module.exports = {
    orderSchema : orderValidationSchema
}