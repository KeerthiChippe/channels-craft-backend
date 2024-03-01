const CustomerProfile = require("../models/customerProfile-model");
const OperatorProfile = require('../models/operatorProfile-model');
const Order = require("../models/order-model");
const Package = require('../models/package-model');
const Payment = require("../models/payment-model");

const dashboardCltrs = {};

dashboardCltrs.getAllUsers = async (req, res) => {
    try {
        const operatorCustomers = await CustomerProfile.aggregate([
            {
                $lookup: {
                    from: 'operatorprofiles', // Name of the OperatorProfile collection
                    localField: 'operatorId',
                    foreignField: '_id',
                    as: 'operator'
                }
            },
            {
                $group: {
                    _id: '$operatorId',
                    operatorName: { $first: '$operator.operatorName' },
                    customerCount: { $sum: 1 }
                }
            }
        ]);

        res.json(operatorCustomers);
    } catch (e) {
        console.log(e);
        res.status(500).json(e);
    }
};

dashboardCltrs.trendingPackages = async (req, res) => {
    try {
      // Fetch all successful payments
      const successfulPayments = await Payment.find({ status: 'success' });
  
      if (!successfulPayments || successfulPayments.length === 0) {
        // Handle case where no successful payments found
        return res.status(404).json({ message: 'No successful payments found' });
      }
  
      // Count sold packages
      const soldPackagesCount = {};
    for (const payment of successfulPayments) {
        // Retrieve the order details using the orderId
        const order = await Order.findById(payment.orderId);
    
        if (order && order.packages) {
            // Output package details if found
            order.packages.forEach((package) => {
                // console.log('Package:', package.packageId);
                // console.log('Package Price:', package.packagePrice);
                soldPackagesCount[package.packageId] = (soldPackagesCount[package.packageId] || 0) + 1;
            });
        } else {
            // console.log('No packages found for orderId:', payment.orderId);
        }
    }
    
      // Sort sold packages by count in descending order and get top 5
      const sortedSoldPackages = Object.entries(soldPackagesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
  
      // Fetch package details for the top 5 trending packages
      const trendingPackages = await Promise.all(sortedSoldPackages.map(async ([packageId, soldCount]) => {
        const package = await Package.findById(packageId);
        return { 
            packageName: package.packageName,
            packagePrice: package.packagePrice,
            soldCount,
            image: package.image
        };
      }));
  
      // console.log(trendingPackages, 'trendingPackages')
      res.json(trendingPackages);
    } catch (error) {
      console.error('Error fetching trending packages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

module.exports = dashboardCltrs;
