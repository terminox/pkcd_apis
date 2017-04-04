const Mongoose = require('mongoose')
const Schema   = Mongoose.Schema

const Business = require('./business')

// SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
const options = {
  discriminatorKey: 'category'
}

const Hotel = new Schema({
  checkInTime:  { type: String },
  checkOutTime: { type: String },
  price:        { type: String }
}, options)

module.exports = Business.discriminator('hotel', Hotel)
