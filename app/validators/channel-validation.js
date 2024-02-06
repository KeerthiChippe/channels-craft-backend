const Channel = require('../models/channel-model')
const channelValidationSchema = {
    channelName:{
        notEmpty:{
            errormessage:'channel name is required'
        }
    },
    channelPrice:{
        notEmpty:{
            errormessage:'price is required'
        },
        isNumeric:{
            errormessage:'price should be a number'
        }
    },
    language :{
        notEmpty:{
            errormessage:'language is required'
        }
    },
    channelNumber:{
        notEmpty:{
            errormessage:'channel number is required'
        },
        isNumeric:{
            errormessage:'channel number should be a number'
        },
        custom:{
            options: async function (value){
                const existingchannel = await Channel.findOne({channelNumber:value })
                if(existingchannel){
                    throw new Error ('channel number already exists')
                }else{
                    return true
                }
            }
        }
    }
}

const channelUpdateValidationSchema = {
    channelPrice:{
        notEmpty:{
            errormessage:'price is required'
        },
        isNumeric:{
            errormessage:'price should be a number'
        }
    }
}

module.exports={
    channelsSchema:channelValidationSchema,
    channelUpdateSchema:channelUpdateValidationSchema
}